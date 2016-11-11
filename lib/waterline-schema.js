
/**
 * Module dependencies
 */

var Schema = require('./waterline-schema/schema');
var ForeignKeys = require('./waterline-schema/foreignKeys');
var JoinTables = require('./waterline-schema/joinTables');
var References = require('./waterline-schema/references');

/**
 * Used to build a Waterline Schema object from a set of
 * loaded collections. It should turn the attributes into an
 * object that can be sent down to an adapter and understood.
 *
 * @param {Array} collections
 * @param {Object} connections
 * @return {Object}
 * @api public
 */

module.exports = function(collections) {
  var schema = {};

  // Transform Collections into a basic schema
  schema = Schema(collections);

  // Map out and expand foreign keys on the collection schema attributes
  ForeignKeys(schema);

  // Build and map any generated join tables on the collection schema
  JoinTables(schema);

  // Add References for Has Many Keys
  this.schema = new References(this.schema);

  return this.schema;

};
