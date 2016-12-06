/**
 * Module dependencies
 */

var Schema = require('./waterline-schema/schema');
var ForeignKeys = require('./waterline-schema/foreignKeys');
var JoinTables = require('./waterline-schema/joinTables');
var References = require('./waterline-schema/references');


//  ██╗    ██╗ █████╗ ████████╗███████╗██████╗ ██╗     ██╗███╗   ██╗███████╗
//  ██║    ██║██╔══██╗╚══██╔══╝██╔════╝██╔══██╗██║     ██║████╗  ██║██╔════╝
//  ██║ █╗ ██║███████║   ██║   █████╗  ██████╔╝██║     ██║██╔██╗ ██║█████╗
//  ██║███╗██║██╔══██║   ██║   ██╔══╝  ██╔══██╗██║     ██║██║╚██╗██║██╔══╝
//  ╚███╔███╔╝██║  ██║   ██║   ███████╗██║  ██║███████╗██║██║ ╚████║███████╗
//   ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝
//
//  ███████╗ ██████╗██╗  ██╗███████╗███╗   ███╗ █████╗
//  ██╔════╝██╔════╝██║  ██║██╔════╝████╗ ████║██╔══██╗
//  ███████╗██║     ███████║█████╗  ██╔████╔██║███████║
//  ╚════██║██║     ██╔══██║██╔══╝  ██║╚██╔╝██║██╔══██║
//  ███████║╚██████╗██║  ██║███████╗██║ ╚═╝ ██║██║  ██║
//  ╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝
//
// Used to build a Waterline Schema object from a set of loaded collections.
// It should normalize attribute definitions and expand out associations. This
// module is used internally to Waterline and provides no benefits outside of
// it. The expanded properties added to associations are not appropriate for use
// directly inside of your Waterline models.

module.exports = function WaterlineSchema(collections) {
  var schema = {};

  // Transform Collections into a basic schema
  schema = Schema(collections);

  // Map out and expand foreign keys on the collection schema attributes
  ForeignKeys(schema);

  // Build and map any generated join tables on the collection schema
  JoinTables(schema);

  // Add References for Has Many Keys
  References(schema);

  return schema;
};
