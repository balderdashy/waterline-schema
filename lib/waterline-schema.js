
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
  this.schema = {};

  // Transform Collections into a basic schema
  this.schema = Schema(collections);

  // Build Out Foreign Keys
  ForeignKeys(this.schema);

  // Add Join Tables
  this.schema = new JoinTables(this.schema);

  // Add References for Has Many Keys
  this.schema = new References(this.schema);

  return this.schema;

};
