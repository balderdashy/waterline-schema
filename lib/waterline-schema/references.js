
/**
 * Module Dependencies
 */

var _ = require('lodash');

/**
 * Expose References
 */

module.exports = References;

/**
 * Map References for hasMany attributes. Not necessarily used for most schemas
 * but used internally in Waterline. It could also be helpful for key/value datastores.
 *
 * @param {Object} collections
 * @return {Object}
 * @api private
 */

function References(collections) {
  collections = collections || {};
  this.collections = _.clone(collections);

  for(var collection in collections) {
    this.addKeys(collection);
  }

  return this.collections;
}

/**
 * Add Reference Keys to hasMany attributes
 *
 * @param {String} collection
 * @api private
 */

References.prototype.addKeys = function(collection) {
  var attributes = this.collections[collection].attributes;

  for(var attribute in attributes) {
    if(!attributes[attribute].hasOwnProperty('collection')) continue;

    attributes[attribute].collection = attributes[attribute].collection.toLowerCase();

    // Figure out what to reference by looing through the other collection
    var reference = this.findReference(collection, attributes[attribute].collection);
    if(!reference) continue;

    attributes[attribute].references = attributes[attribute].collection;
    attributes[attribute].on = reference.toLowerCase();
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

References.prototype.findReference = function(parent, collection) {
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
