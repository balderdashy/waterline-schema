
/**
 * Module dependencies
 */

var _ = require('lodash'),
    Attributes = require('./waterline-schema/attributes'),
    ForeignKeys = require('./waterline-schema/foreignKeys'),
    JoinTables = require('./waterline-schema/joinTables'),
    References = require('./waterline-schema/references');

/**
 * Used to build a Waterline Schema object from a set of
 * loaded collections. It should turn the attributes into an
 * object that can be sent down to an adapter and understood.
 *
 * @param {Array} collection
 * @return {Object}
 * @api public
 */

module.exports = function(collections) {
  this.schema = {};

  // Transform Collections into a basic schema
  this.schema = new Attributes(collections);

  // Build Out Foreign Keys
  this.schema = new ForeignKeys(this.schema);

  // Add Join Tables
  this.schema = new JoinTables(this.schema);

  // Add References for Has Many Keys
  this.schema = new References(this.schema);

  return this.schema;
};
