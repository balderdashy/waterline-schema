//  ██████╗ ██╗   ██╗██╗██╗     ██████╗
//  ██╔══██╗██║   ██║██║██║     ██╔══██╗
//  ██████╔╝██║   ██║██║██║     ██║  ██║
//  ██╔══██╗██║   ██║██║██║     ██║  ██║
//  ██████╔╝╚██████╔╝██║███████╗██████╔╝
//  ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝
//
//   █████╗ ████████╗████████╗██████╗ ██╗██████╗ ██╗   ██╗████████╗███████╗███████╗
//  ██╔══██╗╚══██╔══╝╚══██╔══╝██╔══██╗██║██╔══██╗██║   ██║╚══██╔══╝██╔════╝██╔════╝
//  ███████║   ██║      ██║   ██████╔╝██║██████╔╝██║   ██║   ██║   █████╗  ███████╗
//  ██╔══██║   ██║      ██║   ██╔══██╗██║██╔══██╗██║   ██║   ██║   ██╔══╝  ╚════██║
//  ██║  ██║   ██║      ██║   ██║  ██║██║██████╔╝╚██████╔╝   ██║   ███████╗███████║
//  ╚═╝  ╚═╝   ╚═╝      ╚═╝   ╚═╝  ╚═╝╚═╝╚═════╝  ╚═════╝    ╚═╝   ╚══════╝╚══════╝
//
// Takes a collection of attributes from a Waterline Collection
// and builds up an initial schema by normalizing into a known format.

var _ = require('@sailshq/lodash');
var validProperties = require('./valid-properties');

module.exports = function Attributes(collections) {
  // Build up a schema object to return
  var attributes = {};

  // Validate that collections exists and is an array
  if (_.isUndefined(collections) || !_.isArray(collections)) {
    throw new Error('Invalid collections argument.');
  }

  // Process each collection
  _.each(collections, function normalizeCollection(collectionPrototype) {
    var collection = collectionPrototype.prototype;

    //  ╔╗╔╔═╗╦═╗╔╦╗╔═╗╦  ╦╔═╗╔═╗  ┬┌┬┐┌─┐┌┐┌┌┬┐┬┌┬┐┬ ┬
    //  ║║║║ ║╠╦╝║║║╠═╣║  ║╔═╝║╣   │ ││├┤ │││ │ │ │ └┬┘
    //  ╝╚╝╚═╝╩╚═╩ ╩╩ ╩╩═╝╩╚═╝╚═╝  ┴─┴┘└─┘┘└┘ ┴ ┴ ┴  ┴
    if(_.has(collection, 'tableName') && !_.has(collection, 'identity')) {
      collection.identity = collection.tableName;
    }

    // Require an identity so the object key can be set
    if(!_.has(collection, 'identity')) {
      throw new Error('A Collection must include an identity or tableName attribute');
    }


    //  ╔═╗╔═╗╔╦╗  ┌─┐┬─┐┬┌┬┐┌─┐┬─┐┬ ┬  ┬┌─┌─┐┬ ┬
    //  ╚═╗║╣  ║   ├─┘├┬┘││││├─┤├┬┘└┬┘  ├┴┐├┤ └┬┘
    //  ╚═╝╚═╝ ╩   ┴  ┴└─┴┴ ┴┴ ┴┴└─ ┴   ┴ ┴└─┘ ┴
    // A collection's primary key can be set in one of two places currently. It
    // could either be defined in the model options or as a flag inside one of
    // the attributes. Either way EVERY model must contain an attribute with a
    // primary key.
    var primaryKey;

    // Start by checking if it's defined in the collection
    if (_.has(collection, 'primaryKey') && _.isString(collection.primaryKey)) {
      // Check and make sure the attribute actually exists
      if (!_.has(collection.attributes, collection.primaryKey)) {
        throw new Error('The model ' + collection.identity + ' defined a primary key of ' + collection.primaryKey + ' but that attribute could not be found on the model.');
      }

      // Otherwise set the primary key
      primaryKey = collection.primaryKey;
    }

    // If the primary key wasn't found in the model settings, check each attribute
    // and look for a primaryKey flag that is set to `true`.
    if (!primaryKey) {
      _.each(collection.attributes, function(attribute, attributeName) {
        if (!_.has(attribute, 'primaryKey') || attribute.primaryKey !== true) {
          return;
        }

        // Check and make sure a primary key wasn't already set
        if (primaryKey) {
          throw new Error('Only a single attribute can be set as the primary key on a model. The model ' + collection.identity + ' was found to have at least two attributes set as a primary key. Both ' + primaryKey + ' and ' + attributeName + ' seem to have the primaryKey flag toggled on.');
        }

        primaryKey = attributeName;
      });
    }

    // If there still wasn't a primary key set, throw an error
    if (!primaryKey) {
      throw new Error('Could not find a primary key attribute on the model ' + collection.identity + '. All models must contain an attribute that acts as the primary key and is guarenteed to be unique.');
    }

    // Store the primary key on the collection
    collectionPrototype.primaryKey = primaryKey;

    // Validate the attributes
    _.each(collection.attributes, function(attribute, attributeName) {
      //  ╔═╗╔╗╔╔═╗╦ ╦╦═╗╔═╗  ┌┐┌┌─┐  ┬┌┐┌┌─┐┌┬┐┌─┐┌┐┌┌─┐┌─┐  ┌┬┐┌─┐┌┬┐┬ ┬┌─┐┌┬┐┌─┐
      //  ║╣ ║║║╚═╗║ ║╠╦╝║╣   ││││ │  ││││└─┐ │ ├─┤││││  ├┤   │││├┤  │ ├─┤│ │ ││└─┐
      //  ╚═╝╝╚╝╚═╝╚═╝╩╚═╚═╝  ┘└┘└─┘  ┴┘└┘└─┘ ┴ ┴ ┴┘└┘└─┘└─┘  ┴ ┴└─┘ ┴ ┴ ┴└─┘─┴┘└─┘
      //  ┌─┐─┐ ┬┬┌─┐┌┬┐  ┌─┐┌┐┌  ┌┬┐┬ ┬┌─┐  ┌┬┐┌─┐┌┬┐┌─┐┬
      //  ├┤ ┌┴┬┘│└─┐ │   │ ││││   │ ├─┤├┤   ││││ │ ││├┤ │
      //  └─┘┴ └─┴└─┘ ┴   └─┘┘└┘   ┴ ┴ ┴└─┘  ┴ ┴└─┘─┴┘└─┘┴─┘
      if (_.isFunction(attribute)) {
        throw new Error('Functions are not allowed as attributes and instance methods on models have been removed. Please change the ' + attributeName + ' on the ' + collection.identity + ' model.');
      }


      //  ╔═╗╔╗╔╔═╗╦ ╦╦═╗╔═╗  ┌─┐┌┐┌┬ ┬ ┬  ┌┬┐┬ ┬┌─┐┌─┐┌─┐  ┌─┐┬─┐┌─┐
      //  ║╣ ║║║╚═╗║ ║╠╦╝║╣   │ │││││ └┬┘   │ └┬┘├─┘├┤ └─┐  ├─┤├┬┘├┤
      //  ╚═╝╝╚╝╚═╝╚═╝╩╚═╚═╝  └─┘┘└┘┴─┘┴    ┴  ┴ ┴  └─┘└─┘  ┴ ┴┴└─└─┘
      //  ┌─┐┌─┐┌┬┐  ┌─┐┌┐┌  ┌┬┐┬ ┬┌─┐  ┌─┐┌┬┐┌┬┐┬─┐┬┌┐ ┬ ┬┌┬┐┌─┐┌─┐
      //  └─┐├┤  │   │ ││││   │ ├─┤├┤   ├─┤ │  │ ├┬┘│├┴┐│ │ │ ├┤ └─┐
      //  └─┘└─┘ ┴   └─┘┘└┘   ┴ ┴ ┴└─┘  ┴ ┴ ┴  ┴ ┴└─┴└─┘└─┘ ┴ └─┘└─┘
      // If the attribute contains a property that isn't whitelisted, then return
      // an error.
      _.each(attribute, function(propertyValue, propertyName) {
        if (_.indexOf(validProperties, propertyName) < 0) {
          throw new Error('The attribute ' + attributeName + ' contains invalid properties. The property ' + propertyName + ' isn\'t a recognized property.');
        }
      });


      //  ╦  ╦╔═╗╦  ╦╔╦╗╔═╗╔╦╗╔═╗  ┌┬┐┬ ┬┌─┐  ┌─┐┌┬┐┌┬┐┬─┐┬┌┐ ┬ ┬┌┬┐┌─┐
      //  ╚╗╔╝╠═╣║  ║ ║║╠═╣ ║ ║╣    │ ├─┤├┤   ├─┤ │  │ ├┬┘│├┴┐│ │ │ ├┤
      //   ╚╝ ╩ ╩╩═╝╩═╩╝╩ ╩ ╩ ╚═╝   ┴ ┴ ┴└─┘  ┴ ┴ ┴  ┴ ┴└─┴└─┘└─┘ ┴ └─┘
      //  ┌┐┌┌─┐┌┬┐┌─┐
      //  │││├─┤│││├┤
      //  ┘└┘┴ ┴┴ ┴└─┘
      // Check for dots in name
      if(attributeName.match(/\./g)) {
        throw new Error('Invalid Attribute Name: Attributes may not contain a \'.\' character.');
      }
    }); // </ .each(attributes)

    //  ╔═╗╔╦╗╔╦╗  ┌┬┐┬ ┬┌─┐  ┌─┐┌┬┐┌┬┐┬─┐┬┌┐ ┬ ┬┌┬┐┌─┐
    //  ╠═╣ ║║ ║║   │ ├─┤├┤   ├─┤ │  │ ├┬┘│├┴┐│ │ │ ├┤
    //  ╩ ╩═╩╝═╩╝   ┴ ┴ ┴└─┘  ┴ ┴ ┴  ┴ ┴└─┴└─┘└─┘ ┴ └─┘
    attributes[collection.identity] = {
      primaryKey: primaryKey,
      identity: collection.identity,
      tableName: collection.tableName || collection.identity,
      connection: collection.connection,
      attributes: collection.attributes,
      meta: collection.meta || {}
    };
  }); // </ .each(collections)

  // Return the attributes
  return attributes;
};
