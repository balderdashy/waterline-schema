
/**
 * Module dependencies
 */

var _ = require('lodash'),
    hasOwnProperty = require('./utils').object.hasOwnProperty;

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

    var child = this.collections[attr.collection.toLowerCase()];

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
        attribute: attribute.toLowerCase(),
        via: attr.via
      },

      column_two: {
        collection: attr.collection.toLowerCase(),
        attribute: attr.via.toLowerCase(),
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
    if(!attributes[attribute].hasOwnProperty('collection')) continue;
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
  table.tables = [c1.collection, c2.collection];
  table.junctionTable = true;

  // Use the connection from the column one definition
  table.connection = this.collections[c1.collection].connection;

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
 * Build a Foreign Key value for an attribute in the join collection
 *
 * @param {Object} column_one
 * @param {Object} column_two
 * @return {Object}
 * @api private
 */

JoinTables.prototype.buildForeignKey = function(column_one, column_two) {
  var primaryKey = this.findPrimaryKey(column_one.collection);
  var columnName = (column_one.collection + '_' + column_one.attribute).toLowerCase();
  var viaName = column_two.collection + '_' + column_one.via;

  return {
    columnName: columnName,
    type: primaryKey.attributes.type,
    foreignKey: true,
    references: column_one.collection.toLowerCase(),
    on: primaryKey.name.toLowerCase(),
    via: viaName,
    groupKey: column_one.collection.toLowerCase()
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
    var table1 = table.tables[0];
    var table2 = table.tables[1];

    for(var key in self.tables) {
      var join = self.tables[key];

      if(join.tables.indexOf(table1) < 0) continue;
      if(join.tables.indexOf(table2) < 0) continue;

      add = false;
    }

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
  if(!this.collections[collection]) return null;
  if(!this.collections[collection].attributes) return null;

  var primaryKey = null;

  for(var key in this.collections[collection].attributes) {
    var attribute = this.collections[collection].attributes[key];

    if(!attribute.hasOwnProperty('primaryKey')) continue;

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
    if(!attributes[attribute].hasOwnProperty('collection')) continue;

    var link = attributes[attribute].collection;
    var joined = this.findJoinTable(collection, link);

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
    if(!attributes[attribute].hasOwnProperty('through')) continue;

    var linkedCollection = attributes[attribute].through.toLowerCase();
    this.collections[linkedCollection].junctionTable = true;

    // Build up proper reference on the attribute
    attributes[attribute].collection = linkedCollection;
    attributes[attribute].references = linkedCollection;

    // Find Reference Key
    var reference = this.findReference(collection, linkedCollection);
    attributes[attribute].on = reference.toLowerCase();

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
    if(!attributes[attribute].hasOwnProperty('foreignKey')) continue;
    if(!attributes[attribute].hasOwnProperty('references')) continue;
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
 * @return {Object}
 * @api private
 */

JoinTables.prototype.findJoinTable = function(parent, child) {
  var join = false,
      tableCollection;

  for(var table in this.tables) {
    var tables = this.tables[table].tables;

    if(tables.indexOf(parent) < 0) continue;
    if(tables.indexOf(child) < 0) continue;

    join = true;
    tableCollection = this.tables[table];
  }

  return { join: join, table: tableCollection };
};
