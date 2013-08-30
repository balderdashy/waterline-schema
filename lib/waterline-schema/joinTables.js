
/**
 * Module dependencies
 */

var _ = require('underscore');

/**
 * Expose JoinTables
 */

module.exports = JoinTables;

/**
 * Insert Join/Junction Tables where needed whenever two collections
 * point to each other.
 *
 * @param {Object} collections
 * @return {Object}
 * @api private
 */

function JoinTables(collections) {
  collections = collections || {};
  this.collections = _.clone(collections);
  this.tables = {};

  for(var collection in collections) {
    var joinTables = this.buildJoins(collection);
    this.uniqueTables(joinTables);
  }

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
    var joinCollections = this.findMatchingCollections(collection, collectionName, attributes);

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
 * Find a matching Has Many attribute in a collection.
 *
 * @param {String} parent
 * @param {String} child
 * @apram {Object} parentAttributes
 * @return {Array}
 * @api private
 */

JoinTables.prototype.findMatchingCollections = function(parent, child, parentAttributes) {
  var collections = [];

  for(var attribute in parentAttributes) {
    if(!parentAttributes[attribute].collection) continue;
    if(parentAttributes[attribute].collection.toLowerCase() !== child.toLowerCase()) continue;
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
      if(join.tables.indexOf(table1) > -1 && join.tables.indexOf(table2) > -1) {
        add = false;
      }
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
