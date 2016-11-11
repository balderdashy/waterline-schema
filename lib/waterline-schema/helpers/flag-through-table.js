//  ███████╗██╗      █████╗  ██████╗     ████████╗██╗  ██╗██████╗  ██████╗ ██╗   ██╗ ██████╗ ██╗  ██╗
//  ██╔════╝██║     ██╔══██╗██╔════╝     ╚══██╔══╝██║  ██║██╔══██╗██╔═══██╗██║   ██║██╔════╝ ██║  ██║
//  █████╗  ██║     ███████║██║  ███╗       ██║   ███████║██████╔╝██║   ██║██║   ██║██║  ███╗███████║
//  ██╔══╝  ██║     ██╔══██║██║   ██║       ██║   ██╔══██║██╔══██╗██║   ██║██║   ██║██║   ██║██╔══██║
//  ██║     ███████╗██║  ██║╚██████╔╝       ██║   ██║  ██║██║  ██║╚██████╔╝╚██████╔╝╚██████╔╝██║  ██║
//  ╚═╝     ╚══════╝╚═╝  ╚═╝ ╚═════╝        ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝
//
//  ████████╗ █████╗ ██████╗ ██╗     ███████╗
//  ╚══██╔══╝██╔══██╗██╔══██╗██║     ██╔════╝
//     ██║   ███████║██████╔╝██║     █████╗
//     ██║   ██╔══██║██╔══██╗██║     ██╔══╝
//     ██║   ██║  ██║██████╔╝███████╗███████╗
//     ╚═╝   ╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝
//
// When a many-to-many through table is used, flag the table in the schema
// as a join table.

var _ = require('@sailshq/lodash');

module.exports = function flagThroughTable(collectionName, schema) {
  var attributes = schema[collectionName].schema;

  // Look for attributes with "through" properties
  _.each(attributes, function(attributeVal, attributeName) {
    if (!_.has(attributeVal, 'through')) {
      return;
    }

    // Find the collection that is being pointed to
    var linkedCollection = attributeVal.through;
    schema[linkedCollection].throughTable = schema[linkedCollection].throughTable || {};
    var throughPath = collectionName + '.' + attributeName;
    var linkedAttrs = schema[linkedCollection].schema;

    // Find the attribute on the linked collection that references this collection
    schema[linkedCollection].throughTable[throughPath] = _.find(_.keys(linkedAttrs), function(attrName) {
      return linkedAttrs[attrName].references === attributeVal.collection.toLowerCase();
    });

    // Build up proper reference on the attribute
    attributeVal.collection = linkedCollection;
    attributeVal.references = linkedCollection;

    // Find Reference Key
    var via = attributeVal.via;
    var reference;

    _.each(linkedAttrs, function(linkedAttrVal, linkedAttrName) {
      // If the reference was already found, stop processing
      if (reference) {
        return;
      }

      if (!_.has(linkedAttrVal, 'foreignKey')) {
        return;
      }
      if (!_.has(linkedAttrVal, 'references')) {
        return;
      }

      if(linkedAttrVal.references !== collectionName) {
        return;
      }

      if(via !== linkedAttrName) {
        return;
      }

      reference = linkedAttrVal.columnName;
    });

    if (!reference) {
      throw new Error('A `through` property was set on the attribute ' + attributeName + ' on the ' + collectionName + ' model but no reference in the through model was found.');
    }

    // Set the reference
    attributeVal.on = reference;
    attributeVal.onKey = reference;

    // Remove the through key from the schema definition
    delete attributeVal.through;

    // Set the attribute value
    attributes[attributeName] = attributeVal;
  });
};
