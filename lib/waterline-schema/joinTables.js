
/**
 * Module dependencies
 */

var _ = require('lodash');

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
  this.collections = _.clone(collections);
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
 * Find any Join Tables needed for a collection.
 *
 * @param {String} collection
 * @return {Array}
 * @api private
 */

JoinTables.prototype.buildJoins = function(collection) {
  var attributes = this.collections[collection].attributes,
      hasManyCollections = this.mapCollections(attributes),
      tables = [];

  if(hasManyCollections.length === 0) return [];

  for(var collectionName in this.collections) {

    // Ignore the currect collection
    if(collectionName.toLowerCase() === collection.toLowerCase()) continue;

    // If there isn't a matching collection key ignore it
    if(hasManyCollections.indexOf(collectionName) < 0) continue;

    // Find a matching has_many attribute in the collection
    var parent = collection;
    var childName = hasManyCollections[hasManyCollections.indexOf(collectionName)];
    var childAttributes = this.collections[childName].attributes;

    var joinCollections = this.findMatchingCollections(parent, childName, childAttributes);
    if(joinCollections.length === 0) continue;

    // Build join tables
    tables = tables.concat(this.buildTables(collectionName, joinCollections));
  }

  return tables;
};

/**
 * Find Has Many attributes for a given set of attributes.
 *
 * @param {Object} attributes
 * @return {Array}
 * @api private
 */

JoinTables.prototype.mapCollections = function(attributes) {
  var collections = [];

  for(var attribute in attributes) {
    if(!attributes[attribute].hasOwnProperty('collection')) continue;
    collections.push(attributes[attribute].collection.toLowerCase());
  }

  return collections;
};

/**
 * Find any matching Has Many attributes in a collection.
 *
 * Used to figure out what collections point to each other in order to build
 * join tables and update collection attributes to point to the join table.
 *
 * @param {String} parent
 * @param {String} child
 * @apram {Object} parentAttributes
 * @return {Array}
 * @api private
 */

JoinTables.prototype.findMatchingCollections = function(parent, child, childAttributes) {
  var collections = [];

  for(var attribute in childAttributes) {
    if(!childAttributes[attribute].hasOwnProperty('collection')) continue;
    if(childAttributes[attribute].hasOwnProperty('through')) continue;
    if(childAttributes[attribute].collection.toLowerCase() !== parent.toLowerCase()) continue;
    collections.push(parent);
  }

  return collections;
};

/**
 * Builds Join Tables for a Collection
 *
 * @param {String} collection
 * @apram {Array} joins
 * @return {Array}
 * @api private
 */

JoinTables.prototype.buildTables = function(collection, joins) {
  var self = this,
      tables = [];

  joins.forEach(function(join) {
    var table = self.buildTable(collection, join);
    tables.push(table);
  });

  return tables;
};

/**
 * Build Collection for a single join
 *
 * @param {String} collection
 * @apram {Object} attributes
 * @return {Object}
 * @api private
 */

JoinTables.prototype.buildTable = function(collection, attribute) {
  var table = {};

  table.identity = this.buildCollectionName(collection, attribute).toLowerCase();
  table.adapter = this.collections[collection].adapter;
  table.tables = [collection.toLowerCase(), attribute.toLowerCase()];
  table.junctionTable = true;

  // Add each foreign key as an attribute
  table.attributes = {};
  table.attributes[collection] = this.buildForeignKey(collection);
  table.attributes[attribute] = this.buildForeignKey(attribute);

  return table;
};

/**
 * Build a collection name by combining two collections names.
 *
 * @param {String} collection
 * @param {String} attribute
 * @return {String}
 * @api private
 */

JoinTables.prototype.buildCollectionName = function(collection, attribute) {
  if(collection > attribute) return attribute + '_' + collection;
  return collection + '_' + attribute;
};

/**
 * Build a Foreign Key value for an attribute in the join collection
 *
 * @param {String} collection
 * @return {Object}
 * @api private
 */

JoinTables.prototype.buildForeignKey = function(collection) {
  var primaryKey = this.findPrimaryKey(collection);
  var columnName = collection.toLowerCase() + '_' + primaryKey.name.toLowerCase();

  return {
    columnName: columnName,
    type: primaryKey.attributes.type,
    foreignKey: true,
    references: collection.toLowerCase(),
    on: primaryKey.name.toLowerCase(),
    groupKey: collection.toLowerCase()
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
      on: joined.table.attributes[collection].columnName
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
