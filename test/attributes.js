var Attributes = require('../lib/waterline-schema/attributes'),
    assert = require('assert');

describe('Attributes', function() {

  describe('with automatic attribute flags', function() {
    var collection;

    before(function() {
      collection = function() {};
      collection.prototype = {
        tableName: 'FOO',
        autoPK: false,
        autoCreatedAt: false,
        autoUpdatedAt: false,
        attributes: {
          foo: 'string',
          bar: 'string',
          fn: function() {}
        }
      };
    });

    it('should build an attributes definition containing two keys', function() {
      var obj = new Attributes({ foo: collection });

      assert(obj.foo);
      assert(Object.keys(obj.foo.attributes).length === 2);
      assert(obj.foo.attributes.foo);
      assert(obj.foo.attributes.bar);
    });

    it('should strip functions', function() {
      var obj = new Attributes({ foo: collection });
      assert(!obj.foo.attributes.fn);
    });

    it('should set defaults for adapters', function() {
      var obj = new Attributes({ foo: collection });
      assert(obj.foo.adapter === '');
    });
  });


  describe('with automatic attribute flags not set', function() {
    var collection;

    before(function() {
      collection = function() {};
      collection.prototype = {
        tableName: 'FOO',
        attributes: {
          foo: 'string',
          bar: 'string',
          fn: function() {}
        }
      };
    });

    it('should add auto attributes to the definition', function() {
      var obj = new Attributes({ foo: collection });
      assert(obj.foo);
      assert(Object.keys(obj.foo.attributes).length === 5);
      assert(obj.foo.attributes.foo);
      assert(obj.foo.attributes.bar);
      assert(obj.foo.attributes.id);
      assert(obj.foo.attributes.createdAt);
      assert(obj.foo.attributes.updatedAt);
    });

    it('should inject flags into the collection', function() {
      var obj = new Attributes({ foo: collection });
      assert(collection.prototype.autoPK);
      assert(collection.prototype.autoCreatedAt);
      assert(collection.prototype.autoUpdatedAt);
    });

    it('should normalize tableName to identity', function() {
      var obj = new Attributes({ foo: collection });
      assert(collection.prototype.identity === 'foo');
    });

    it('should add a primary key field', function() {
      var obj = new Attributes({ foo: collection });
      assert(obj.foo.attributes.id);
      assert(obj.foo.attributes.id.primaryKey);
      assert(obj.foo.attributes.id.unique);
    });

    it('should add in timestamps', function() {
      var obj = new Attributes({ foo: collection });
      assert(obj.foo.attributes.createdAt);
      assert(obj.foo.attributes.updatedAt);
    });
  });

});
