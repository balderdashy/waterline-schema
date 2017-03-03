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
  _.each(attributes, function lookForThroughProperty(attributeVal, attributeName) {
    if (!_.has(attributeVal, 'through')) {
      return;
    }

    // Find the collection that is being pointed to
    var linkedCollectionName = attributeVal.through;
    schema[linkedCollectionName].throughTable = schema[linkedCollectionName].throughTable || {};
    var throughPath = collectionName + '.' + attributeName;
    var linkedAttrs = schema[linkedCollectionName].schema;

    // Set the schema value on the through table
    schema[linkedCollectionName].hasSchema = true;

    // Find the attribute on the linked collection that references this collection
    schema[linkedCollectionName].throughTable[throughPath] =  _.find(_.keys(linkedAttrs), function checkReference(attrName) {
      if (!linkedAttrs[attrName].referenceIdentity) {
        return false;
      }

      return linkedAttrs[attrName].referenceIdentity === attributeVal.collection;
    });

    // Build up proper reference on the attribute
    attributeVal.references = schema[linkedCollectionName].tableName;
    attributeVal.referenceIdentity = linkedCollectionName;

    // Find Reference Key
    var via = attributeVal.via;
    var reference;

    _.each(linkedAttrs, function lookForLinkedAttribute(linkedAttrVal, linkedAttrName) {
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

      if (linkedAttrVal.references !== schema[collectionName].tableName) {
        return;
      }

      if (via !== linkedAttrName) {
        return;
      }

      reference = linkedAttrVal.columnName;
    });

    if (!reference) {
      throw new Error('A `through` property was set on the attribute `' + attributeName + '` on the `' + collectionName + '` model but no reference in the through model was found.');
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
