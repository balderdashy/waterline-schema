//  ██████╗ ██╗   ██╗██╗██╗     ██████╗          ██╗ ██████╗ ██╗███╗   ██╗
//  ██╔══██╗██║   ██║██║██║     ██╔══██╗         ██║██╔═══██╗██║████╗  ██║
//  ██████╔╝██║   ██║██║██║     ██║  ██║         ██║██║   ██║██║██╔██╗ ██║
//  ██╔══██╗██║   ██║██║██║     ██║  ██║    ██   ██║██║   ██║██║██║╚██╗██║
//  ██████╔╝╚██████╔╝██║███████╗██████╔╝    ╚█████╔╝╚██████╔╝██║██║ ╚████║
//  ╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝      ╚════╝  ╚═════╝ ╚═╝╚═╝  ╚═══╝
//
//  ████████╗ █████╗ ██████╗ ██╗     ███████╗    ███████╗ ██████╗██╗  ██╗███████╗███╗   ███╗ █████╗
//  ╚══██╔══╝██╔══██╗██╔══██╗██║     ██╔════╝    ██╔════╝██╔════╝██║  ██║██╔════╝████╗ ████║██╔══██╗
//     ██║   ███████║██████╔╝██║     █████╗      ███████╗██║     ███████║█████╗  ██╔████╔██║███████║
//     ██║   ██╔══██║██╔══██╗██║     ██╔══╝      ╚════██║██║     ██╔══██║██╔══╝  ██║╚██╔╝██║██╔══██║
//     ██║   ██║  ██║██████╔╝███████╗███████╗    ███████║╚██████╗██║  ██║███████╗██║ ╚═╝ ██║██║  ██║
//     ╚═╝   ╚═╝  ╚═╝╚═════╝ ╚══════╝╚══════╝    ╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝
//

var _ = require('@sailshq/lodash');


module.exports = function(tableDef, schema) {
  var c1 = tableDef.column_one;
  var c2 = tableDef.column_two;

  // Build a default table name for the collection
  var identity = (function() {
    if(c1.collection < c2.collection) {
      return c1.collection + '_' + c1.attribute + '__' + c2.collection + '_' + c2.attribute;
    }

    return c2.collection + '_' + c2.attribute + '__' + c1.collection + '_' + c1.attribute;
  })();


  //  ╔═╗╦╔╗╔╔╦╗  ┌┬┐┌─┐┌┬┐┬┌┐┌┌─┐┌┐┌┌┬┐
  //  ╠╣ ║║║║ ║║   │││ ││││││││├─┤│││ │
  //  ╚  ╩╝╚╝═╩╝  ─┴┘└─┘┴ ┴┴┘└┘┴ ┴┘└┘ ┴
  //  ┌─┐┌─┐┬  ┬  ┌─┐┌─┐┌┬┐┬┌─┐┌┐┌
  //  │  │ ││  │  ├┤ │   │ ││ ││││
  //  └─┘└─┘┴─┘┴─┘└─┘└─┘ ┴ ┴└─┘┘└┘
  // If a dominant side of a many-to-many was defined then use that as the source
  // for connection and metadata details. Otherwise use the C1 collection.
  var dominantCollection;
  var nonDominantCollection;

  // Check if the C2 collection defines the dominant side
  var cTwoSchema = schema[c2.collection].schema;
  if (_.has(cTwoSchema[c2.attribute], 'dominant')) {
    dominantCollection = c2.collection;
    nonDominantCollection = c1.collection;
  } else {
    dominantCollection = c1.collection;
    nonDominantCollection = c2.collection;
  }

  // Append the meta data if defined.
  // To do this, merge the two collection meta objects together with the dominant
  // side taking precedence.
  var metaData = _.merge({}, (schema[nonDominantCollection].meta || {}), (schema[dominantCollection].meta || {}));


  //  ╔╗ ╦ ╦╦╦  ╔╦╗  ┌─┐┌─┐┬ ┬┌─┐┌┬┐┌─┐  ┬┌┬┐┌─┐┌┬┐
  //  ╠╩╗║ ║║║   ║║  └─┐│  ├─┤├┤ │││├─┤  │ │ ├┤ │││
  //  ╚═╝╚═╝╩╩═╝═╩╝  └─┘└─┘┴ ┴└─┘┴ ┴┴ ┴  ┴ ┴ └─┘┴ ┴
  var table = {
    identity: identity,
    tableName: identity.toLowerCase(),
    tables: [c1.collection, c2.collection],
    joinedAttributes: [],
    junctionTable: true,
    meta: metaData,
    connection: schema[dominantCollection].connection,
    primaryKey: 'id',
    attributes: {
      id: {
        type: 'number'
      }
    }
  };


  // Build the two foreign key attributes
  var cOnePrimaryKey = schema[c1.collection].primaryKey;
  var cTwoPrimaryKey = schema[c2.collection].primaryKey;

  // Foreign Key Collection One
  table.attributes[c1.collection + '_' + c1.attribute] = {
    columnName: c1.collection + '_' + c1.attribute,
    type: schema[c1.collection].schema[cOnePrimaryKey].type,
    foreignKey: true,
    references: c1.collection.toLowerCase(),
    on: cOnePrimaryKey,
    onKey: cOnePrimaryKey,
    via: c2.collection + '_' + c1.via,
    groupKey: c1.collection
  };

  // Foreign Key Collection Two
  table.attributes[c2.collection + '_' + c2.attribute] = {
    columnName: c2.collection + '_' + c2.attribute,
    type: schema[c2.collection].schema[cTwoPrimaryKey].type,
    foreignKey: true,
    references: c2.collection.toLowerCase(),
    on: cTwoPrimaryKey,
    onKey: cTwoPrimaryKey,
    via: c1.collection + '_' + c2.via,
    groupKey: c2.collection
  };

  table.joinedAttributes.push(c1.collection + '_' + c1.attribute);
  table.joinedAttributes.push(c2.collection + '_' + c2.attribute);

  return table;
};
