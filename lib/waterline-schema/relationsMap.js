
/**
 * Module dependencies
 */

var _ = require('lodash'),
    acyclicTraversal = require('./acyclicTraversal'),
    utils = require('./utils'),
    hop = utils.object.hasOwnProperty;

/**
 * Expose Relations
 */

module.exports = Relations;

/**
 * Relations
 *
 * Builds a mapping of nested associations within a schema. Used in Waterline to do
 * deep populations and to allow nested associations to be created and updated.
 *
 * @param {Object} schema
 * @return {Object}
 */

function Relations(schema) {

  var self = this;

  // Cache schema
  this.schema = schema;

  // For each collection in the schema, map out the relations belonging to it and
  // build up a tree.

  var tree = {};

  Object.keys(schema).forEach(function(collectionName) {
    var map = self.mapRelations(collectionName, schema[collectionName].attributes);
    tree[collectionName] = map;
  });

  return tree;
}


/**
 * mapRelations
 *
 * Given a collection schema, find any association attributes and
 * map out a tree for their relations.
 *
 * @param {Object} attributes
 * @return {Object}
 */

Relations.prototype.mapRelations = function mapRelations(collectionName, attributes) {
  var self = this;
  var modelTree = {};

  Object.keys(attributes).forEach(function(key) {
    var attr = attributes[key];

    // Ignore attributes that are not associations
    if(!hop(attr, 'model') && !hop(attr, 'collection')) return;

    modelTree[key] = acyclicTraversal(self.schema, collectionName, key);

  });

  return modelTree;
};

