
/**
 * Module dependencies
 */

var _ = require('lodash'),
    utils = require('./utils'),
    hasOwnProperty = utils.object.hasOwnProperty;

/**
 * Expose JoinTables
 */

module.exports = JoinTables;

/**
 * Insert Join/Junction Tables where needed whenever two collections
 * point to each other. Also replaces the references to point to the new join table.
 *
 * @param {Object} collections
 * @return {Object}
 * @api private
 */

function JoinTables(collections) {
  var self = this;

  collections = collections || {};
  this.collections = _.cloneDeep(collections);
  this.tables = {};

  // Build Up Join Tables
  for(var collection in collections) {
    var joinTables = this.buildJoins(collection);
    this.uniqueTables(joinTables);

    // Mark hasManyThrough tables as junction tables with select all set to true
    this.markCustomJoinTables(collection);
  }

  // Update Collection Attributes to point to the join table
  this.linkAttributes();

  // Remove properties added just for unqueness
  Object.keys(this.tables).forEach(function(table) {
    delete self.tables[table].joinedAttributes;
  });

  return _.extend(this.collections, this.tables);
}

/**
 * Build A Set of Join Tables
 *
 * @param {String} collection
 * @api private
 * @return {Array}
 */

JoinTables.prototype.buildJoins = function(collection) {
  var attributes = this.collections[collection].attributes,
      collectionAttributes = this.mapCollections(attributes),
      tables = [];

  // If there are no collection attributes return an empty array
  if(Object.keys(collectionAttributes).length === 0) return [];

  // For each collection attribute, inspect it to build up a join table if needed.
  for(var attribute in collectionAttributes) {

    // Check the collection it references to see if this is a one-to-many or many-to-many
    // relationship. If it's a one-to-many we don't need to build up a join table.
    var attr = collectionAttributes[attribute];

    // Ensure the attribute has a `via` property
    if(!hasOwnProperty(attr, 'via')) {
      throw new Error('Collection ' + collection + ' has an association attribute that is missing a '+
        '`via` property. Any associations with a `collection` attribute must specify a `via` option ' +
        'that points to another attribute. Update the attribute: ' + attribute + ' and add a `via` property');
    }

    // Check if this is a hasManyThrough attribute, if so a join table doesn't need to be created
    if(hasOwnProperty(attr, 'through')) continue;

    // Normalize `collection` property name to lowercased version
    attr.collection = attr.collection.toLowerCase();

    var child = this.collections[attr.collection];

    // Ensure the `via` exists on the child.
    if(!hasOwnProperty(child.attributes, attr.via)) {
      throw new Error('Collection ' + collection + ' has a `via` attribute which is missing from the ' +
        'collection ' + attr.collection);
    }

    // If the associated attribute is a foreign key, ignore it
    if(hasOwnProperty(child.attributes[attr.via], 'foreignKey')) continue;

    // Build up an object that can be used to build a join table
    var tableAttributes = {
      column_one: {
        collection: collection.toLowerCase(),
        attribute: attribute,
        via: attr.via
      },

      column_two: {
        collection: attr.collection,
        attribute: attr.via,
        via: attribute
      }
    };

    // Build join tables
    tables = tables.concat(this.buildTable(tableAttributes));
  }

  return tables;
};

/**
 * Find Has Many attributes for a given set of attributes.
 *
 * @param {Object} attributes
 * @return {Object}
 * @api private
 */

JoinTables.prototype.mapCollections = function(attributes) {
  var collectionAttributes = {};

  for(var attribute in attributes) {
    if(!hasOwnProperty(attributes[attribute], 'collection')) continue;
    collectionAttributes[attribute] = attributes[attribute];
  }

  return collectionAttributes;
};

/**
 * Build Collection for a single join
 *
 * @apram {Object} columns
 * @return {Object}
 * @api private
 */

JoinTables.prototype.buildTable = function(columns) {
  var table = {};

  var c1 = columns.column_one;
  var c2 = columns.column_two;

  table.identity = this.buildCollectionName(columns).toLowerCase();
  table.tableName = table.identity;
  table.tables = [c1.collection, c2.collection];
  table.joinedAttributes = [];
  table.junctionTable = true;

  // Look for a dominant collection property so the join table can be created on the correct connection.
  table.connection = this.findDominantConnection(columns);
  if(!table.connection) {
    var err = "A 'dominant' property was not supplied for the two collections in a many-to-many relationship. " +
        "One side of the relationship between '" + c1.collection + "' and '" + c2.collection + "' needs a " +
        "'domiant: true' flag set so a join table can be created on the correct connection.";

    throw new Error(err);
  }

  // Add each foreign key as an attribute
  table.attributes = {
    id: {
      primaryKey: true,
      autoIncrement: true,
      type: 'integer'
    }
  };

  table.attributes[c1.collection + '_' + c1.attribute] = this.buildForeignKey(c1, c2);
  table.attributes[c2.collection + '_' + c2.attribute] = this.buildForeignKey(c2, c1);

  table.joinedAttributes.push(c1.collection + '_' + c1.attribute);
  table.joinedAttributes.push(c2.collection + '_' + c2.attribute);

  return table;
};

/**
 * Build a collection name by combining two collection and attribute names.
 *
 * @param {Object} columns
 * @return {String}
 * @api private
 */

JoinTables.prototype.buildCollectionName = function(columns) {

  var c1 = columns.column_one;
  var c2 = columns.column_two;

  if(c1.collection < c2.collection) {
    return c1.collection + '_' + c1.attribute + '__' + c2.collection + '_' + c2.attribute;
  }

  return c2.collection + '_' + c2.attribute + '__' + c1.collection + '_' + c1.attribute;
};

/**
 * Find the dominant collection.
 *
 * @param {Object} columns
 * @return {String}
 * @api private
 */

JoinTables.prototype.findDominantConnection = function(columns) {

  var c1 = this.collections[columns.column_one.collection];
  var c2 = this.collections[columns.column_two.collection];

  // Don't require a dominant collection on self-referencing associations
  if(columns.column_one.collection === columns.column_two.collection) {
    return c1.connection;
  }

  var dominantCollection = this.searchForAttribute(columns.column_one.collection, 'dominant');
  if(dominantCollection) return c1.connection;

  dominantCollection = this.searchForAttribute(columns.column_two.collection, 'dominant');
  if(dominantCollection) return c2.connection;

  // Don't require a dominant collection for models on the same connection.
  if (c1.connection[0] === c2.connection[0]) {
    return c1.connection;
  }

  return false;
};

/**
 * Search Attributes for an attribute property.
 *
 * @param {String} collectionName
 * @param {String} attributeName
 * @return {String}
 * @api private
 */

JoinTables.prototype.searchForAttribute = function(collectionName, attributeName) {
  var collection = this.collections[collectionName],
      matching;

  Object.keys(collection.attributes).forEach(function(key) {
    var properties = collection.attributes[key];
    if(hasOwnProperty(properties, attributeName)) matching = key;
  });

  return matching;
};

/**
 * Build a Foreign Key value for an attribute in the join collection
 *
 * @param {Object} column_one
 * @param {Object} column_two
 * @return {Object}
 * @api private
 */

JoinTables.prototype.buildForeignKey = function(column_one, column_two) {
  var primaryKey = this.findPrimaryKey(column_one.collection);
  var columnName = (column_one.collection + '_' + column_one.attribute);
  var viaName = column_two.collection + '_' + column_one.via;

  return {
    columnName: columnName,
    type: primaryKey.attributes.type,
    foreignKey: true,
    references: column_one.collection,
    on: primaryKey.name,
    via: viaName,
    groupKey: column_one.collection
  };
};

/**
 * Filter Out Duplicate Join Tables
 *
 * @param {Array} tables
 * @api private
 */

JoinTables.prototype.uniqueTables = function(tables) {
  var self = this;

  tables.forEach(function(table) {
    var add = true;

    // Check if any tables are already joining these attributes together
    Object.keys(self.tables).forEach(function(tableName) {
      var currentTable = self.tables[tableName];
      if(currentTable.joinedAttributes.indexOf(table.joinedAttributes[0]) === -1) return;
      if(currentTable.joinedAttributes.indexOf(table.joinedAttributes[1]) === -1) return;

      add = false;
    });

    if(hasOwnProperty(self.tables, table.identity)) return;
    if(add) self.tables[table.identity] = table;
  });
};

/**
 * Find a collection's primary key attribute
 *
 * @param {String} collection
 * @return {Object}
 * @api private
 */

JoinTables.prototype.findPrimaryKey = function(collection) {
  if(!this.collections[collection]) {
    throw new Error('Trying to access a collection ' + collection + ' that is not defined.');
  }
  if(!this.collections[collection].attributes) {
    throw new Error('Collection, ' + collection + ', has no attributes defined.');
  }

  var primaryKey = null;

  for(var key in this.collections[collection].attributes) {
    var attribute = this.collections[collection].attributes[key];

    if(!hasOwnProperty(attribute, 'primaryKey')) continue;

    primaryKey = {
      name: key,
      attributes: attribute
    };
  }

  if(!primaryKey) {
    var error = 'Trying to create an association on a model that doesn\'t have a Primary Key.';
    throw new Error(error);
  }

  return primaryKey;
};

/**
 * Update Collection Attributes to point to the join table instead of the other collection
 *
 * @api private
 */

JoinTables.prototype.linkAttributes = function() {
  for(var collection in this.collections) {
    var attributes = this.collections[collection].attributes;
    this.updateAttribute(collection, attributes);
  }
};

/**
 * Update An Attribute
 *
 * @param {String} collection
 * @param {Object} attributes
 * @api private
 */

JoinTables.prototype.updateAttribute = function(collection, attributes) {

  for(var attribute in attributes) {
    if(!hasOwnProperty(attributes[attribute], 'collection')) continue;

    var attr = attributes[attribute];
    var parent = collection;
    var child = attr.collection;
    var via = attr.via;

    var joined = this.findJoinTable(parent, child, via);

    if(!joined.join) continue;

    this.collections[collection].attributes[attribute] = {
      collection: joined.table.identity,
      references: joined.table.identity,
      on: joined.table.attributes[collection + '_' + attribute].columnName
    };
  }
};

/**
 * Mark Custom Join Tables as a Junction Table
 *
 * If a collection has an attribute with a `through` property, lookup
 * the collection it points to and mark it as a `junctionTable`.
 *
 * @param {String} collection
 * @api private
 */

JoinTables.prototype.markCustomJoinTables = function(collection) {
  var attributes = this.collections[collection].attributes;

  for(var attribute in attributes) {
    if(!hasOwnProperty(attributes[attribute], 'through')) continue;

    var linkedCollection = attributes[attribute].through;
    this.collections[linkedCollection].junctionTable = true;

    // Build up proper reference on the attribute
    attributes[attribute].collection = linkedCollection;
    attributes[attribute].references = linkedCollection;

    // Find Reference Key
    var reference = this.findReference(collection, linkedCollection);
    attributes[attribute].on = reference;

    delete attributes[attribute].through;
  }
};

/**
 * Find Reference attribute name in a set of attributes
 *
 * @param {String} parent
 * @param {String} collection
 * @return {String}
 * @api private
 */

JoinTables.prototype.findReference = function(parent, collection) {
  var attributes = this.collections[collection].attributes,
      reference;

  for(var attribute in attributes) {
    if(!hasOwnProperty(attributes[attribute], 'foreignKey')) continue;
    if(!hasOwnProperty(attributes[attribute], 'references')) continue;
    if(attributes[attribute].references !== parent) continue;

    reference = attributes[attribute].columnName || attribute;
    break;
  }

  return reference;
};

/**
 * Search for a matching join table
 *
 * @param {String} parent
 * @param {String} child
 * @param {String} via
 * @return {Object}
 * @api private
 */

JoinTables.prototype.findJoinTable = function(parent, child, via) {
  var join = false,
      tableCollection;

  for(var table in this.tables) {
    var tables = this.tables[table].tables;

    if(tables.indexOf(parent) < 0) continue;
    if(tables.indexOf(child) < 0) continue;

    var column = child + '_' + via;

    if(!hasOwnProperty(this.tables[table].attributes, column)) continue;

    join = true;
    tableCollection = this.tables[table];
    break;
  }

  return { join: join, table: tableCollection };
};
