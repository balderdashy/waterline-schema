var assert = require('assert');
var Schema = require('../lib/waterline-schema');
var _ = require('lodash');

describe('Meta Extended Data', function() {

  describe('on tables', function() {

    var collections = [];

    before(function() {

      var fixtures = [{
        connection: 'f',
        identity: 'user',
        tableName: 'user',
        migrate: 'alter',
        meta: {
          schemaName: 'foo'
        },
        attributes: {
          name: {
            type: 'string'
          }
        }
      },
      {
        connection: 'f',
        identity: 'car',
        tableName: 'car',
        migrate: 'alter',
        attributes: {
          age: {
            type: 'integer'
          }
        }
      }];

      _.each(fixtures, function(fixture) {
        var coll = function() {};
        coll.prototype = fixture;
        collections.push(coll);
      });

    });

    it('should keep the meta key on the user collection', function() {
      var schema = new Schema(collections);
      assert(schema.user.meta);
      assert.equal(schema.user.meta.schemaName, 'foo');
    });

    it('should add an empty meta object to the car collection', function() {
      var schema = new Schema(collections);
      assert(schema.car.meta);
      assert.equal(_.keys(schema.car.meta).length, 0);
    });


  });

  describe('On generated join tables', function() {
    var collections = [];

    before(function() {
      var fixtures = [
        {
          connection: 'f',
          identity: 'user',
          tableName: 'user',
          migrate: 'alter',
          attributes: {
            cars: {
              collection: 'car',
              via: 'drivers'
            }
          }
        },
        {
          connection: 'f',
          identity: 'car',
          tableName: 'car',
          migrate: 'alter',
          meta: {
            schemaName: 'foo'
          },
          attributes: {
            drivers: {
              collection: 'user',
              via: 'cars',
              dominant: true
            }
          }
        }
      ];

      _.each(fixtures, function(fixture) {
        var coll = function() {};
        coll.prototype = fixture;
        collections.push(coll);
      });
    });

    it('should add the meta data to the join table', function() {
      var schema = new Schema(collections);
      assert(schema.car_drivers__user_cars);
      assert(schema.car_drivers__user_cars.meta);
      assert.equal(schema.car_drivers__user_cars.meta.schemaName, 'foo');
    });

  });
});
