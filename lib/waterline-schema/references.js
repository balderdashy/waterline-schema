
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
  var attributes = this.collections[collection].attributes,
      reference;

  for(var attribute in attributes) {
    if(!attributes[attribute].hasOwnProperty('collection')) continue;

    attributes[attribute].collection = attributes[attribute].collection.toLowerCase();

    // Check For HasMany Through
    if(attributes[attribute].hasOwnProperty('through')) {
      reference = this.findReference(attributes[attribute].collection, attributes[attribute].through);
      if(!reference) continue;

      attributes[attribute].references = attributes[attribute].through;
      attributes[attribute].on = attribute.toLowerCase() + '_' + reference.toLowerCase();
      delete attributes[attribute].through;

      continue;
    }

    // Figure out what to reference by looping through the other collection
    reference = this.findReference(collection, attributes[attribute].collection, attributes[attribute]);
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
 * @param {Object} attribute
 * @return {String}
 * @api private
 */

References.prototype.findReference = function(parent, collection, attribute) {

  if(typeof this.collections[collection] != 'object') {
      throw new Error('Cannot find collection \'' + collection + '\' referenced in ' + parent);
  }

  var attributes = this.collections[collection].attributes,
      reference,
      matchingAttributes = [];

  for(var attr in attributes) {
    if(!attributes[attr].hasOwnProperty('foreignKey')) continue;
    if(!attributes[attr].hasOwnProperty('references')) continue;
    if(attributes[attr].references !== parent) continue;

    // Add the attribute to the matchingAttribute array
    matchingAttributes.push(attr);
  }

  // If no matching attributes are found, throw an error because you are trying to add a hasMany
  // attribute to a model where the association doesn't have a foreign key matching the collection.
  if(matchingAttributes.length === 0) {
    throw new Error('Trying to associate a collection attribute to a model that doesn\'t have a ' +
                    'Foreign Key. ' + parent + ' is trying to reference a foreign key in ' + collection);
  }

  // If multiple matching attributes were found on the model, ensure that the collection has a `via`
  // key that describes which foreign key to use when populating.
  if(matchingAttributes.length > 1) {
    if(!attribute.hasOwnProperty('via')) {
      throw new Error('Multiple foreign keys were found on ' + collection + '. You need to specify a ' +
                      'foreign key to use by adding in the `via` property to the collection association');
    }

    // Find the collection attribute used in the `via` property
    var via = false,
        viaName;

    matchingAttributes.forEach(function(attr) {
      if(attr !== attribute.via) return;
      via = attributes[attr];
      viaName = attr;
    });

    if(!via) {
      throw new Error('No matching attribute was found on ' + collection + ' with the name ' + attribute.via);
    }

    reference = via.columnName || viaName;
    return reference;
  }

  // If only a single matching attribute was found we can just use that for the reference
  reference = attributes[matchingAttributes[0]].columnName || matchingAttributes[0];
  return reference;
};
