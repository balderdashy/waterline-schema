
/**
 * Module dependencies
 */

var _ = require('lodash'),
    Attributes = require('./waterline-schema/attributes'),
    ForeignKeys = require('./waterline-schema/foreignKeys'),
    JoinTables = require('./waterline-schema/joinTables'),
    References = require('./waterline-schema/references'),
    RelationsMap = require('./waterline-schema/relationsMap');

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

module.exports = function(collections, connections, defaults) {

  this.schema = {};
  this.relationsMap = {};

  // Transform Collections into a basic schema
  this.schema = new Attributes(collections, connections, defaults);

  // Map out relations
  this.relationsMap = new RelationsMap(this.schema);

  // Build Out Foreign Keys
  this.schema = new ForeignKeys(this.schema);

  // Add Join Tables
  this.schema = new JoinTables(this.schema);

  // Add References for Has Many Keys
  this.schema = new References(this.schema);

  return {
    schema: this.schema,
    relationsMap: this.relationsMap
  };
};
