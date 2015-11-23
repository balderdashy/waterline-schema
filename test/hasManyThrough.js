var assert = require('assert');
var _ = require('lodash');

var Schema = require('../lib/waterline-schema');
var References = require('../lib/waterline-schema/references');
var fixtures = require('./fixtures/many-many-through');

describe('Has Many Through', function() {

  describe('junction table config', function() {
    var collections = [];

    before(function() {
      _.each(fixtures, function(fixture) {
        var coll = function() {};
        coll.prototype = fixture;
        collections.push(coll);
      });
    });

    it('should flag the "through" table and not mark it as a junction table', function() {
      var schema = new Schema(collections);
      var junctionTable = schema.drive;

      assert(!junctionTable.junctionTable);
      assert(junctionTable.throughTable);
    });
  });

  describe('reference mapping', function() {
    var collections = {};

    before(function() {

      collections.foo = {
        tableName: 'foo',
        attributes: {
          id: {
            type: 'integer',
            autoIncrement: true,
            primaryKey: true,
            unique: true
          },
          bars: {
            collection: 'bar' ,
            through: 'foobar'
          }
        }
      };

      collections.foobar = {
        tableName: 'foobar',
        attributes: {
          id: {
            type: 'integer',
            autoIncrement: true,
            primaryKey: true,
            unique: true
          },
          type: {
            type: 'string'
          },
          bar: {
            columnName: 'bar_id',
            foreignKey: true,
            references: 'bar',
            on: 'id'
          }
        }
      };

      collections.bar = {
        tableName: 'bar',
        attributes: {
          id: {
            type: 'integer',
            autoIncrement: true,
            primaryKey: true,
            unique: true
          }
        }
      };
    });


    it('should update the parent collection to point to the join table', function() {
      var obj = new References(collections);

      assert(obj.foo.attributes.bars.references === 'foobar');
      assert(obj.foo.attributes.bars.on === 'bar_id');
    });
  });

});
