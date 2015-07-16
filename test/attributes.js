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
          fn: function() {},
          myObj: {
            test: true
          },
          groupKey: {
            test: "yes"
          }
        }
      };
    });

    it('should strip strings', function() {
      var obj = new Attributes([collection]);
      assert(!obj.foo.attributes.foo);
      assert(!obj.foo.attributes.bar);
    });

    it('should strip a property of object with reserved name', function() {
      var obj = new Attributes([collection]);
      assert(obj.foo.attributes.groupKey);
      assert(!obj.foo.attributes.groupKey.test);
    });

    it('should strip functions', function() {
      var obj = new Attributes([collection]);
      assert(!obj.foo.attributes.fn);
    });

    it('should set defaults for adapters', function() {
      var obj = new Attributes([collection]);
      assert(obj.foo.connection === '');
    });
  });

  describe('with automatic attribute flags not set', function() {
    var collectionFn;

    before(function() {
      collectionFn = function() {
        var collection = function() {};
        collection.prototype = {
          tableName: 'FOO',
          attributes: {
            foo: 'string',
            bar: 'string',
            fn: function() {}
          }
        };

        return collection;
      };
    });

    it('should not add non-reserved attribute names to the definition', function() {
      var coll = collectionFn();
      var obj = new Attributes([coll]);

      assert(obj.foo);
      assert(Object.keys(obj.foo.attributes).length === 3);
      assert(!obj.foo.attributes.foo);
      assert(!obj.foo.attributes.bar);
      assert(obj.foo.attributes.id);
      assert(obj.foo.attributes.createdAt);
      assert(obj.foo.attributes.updatedAt);
    });

    it('should inject flags into the collection', function() {
      var coll = collectionFn();
      var obj = new Attributes([coll]);

      assert(coll.prototype.autoPK);
      assert(coll.prototype.autoCreatedAt);
      assert(coll.prototype.autoUpdatedAt);
    });

    it('should normalize tableName to identity', function() {
      var coll = collectionFn();
      var obj = new Attributes([coll]);
      assert(coll.prototype.identity === 'foo');
    });

    it('should add a primary key field', function() {
      var coll = collectionFn();
      var obj = new Attributes([coll]);
      assert(obj.foo.attributes.id);
      assert(obj.foo.attributes.id.primaryKey);
      assert(obj.foo.attributes.id.unique);
    });

    it('should add in timestamps', function() {
      var coll = collectionFn();
      var obj = new Attributes([coll]);
      assert(obj.foo.attributes.createdAt);
      assert(obj.foo.attributes.updatedAt);
    });
  });

  describe('with custom automatic attribute names', function() {
    var collectionFn;

    before(function() {
      collectionFn = function() {
        var collection = function() {};
        collection.prototype = {
          tableName: 'FOO',
          autoCreatedAt: 'customCreatedAt',
          autoUpdatedAt: 'customUpdatedAt',
          attributes: {
            foo: 'string',
            bar: 'string',
            fn: function() {}
          }
        };

        return collection;
      };
    });

    it('should add auto attributes into the collection', function() {
      var coll = collectionFn();
      var obj = new Attributes([coll]);
      assert(Object.keys(coll.prototype.attributes).length === 6);
      assert(coll.prototype.attributes.foo);
      assert(coll.prototype.attributes.bar);
      assert(coll.prototype.attributes.id);
      assert(coll.prototype.attributes.customCreatedAt);
      assert(coll.prototype.attributes.customUpdatedAt);
    });

    it('should inject the custom names into the collection', function() {
      var coll = collectionFn();
      var obj = new Attributes([coll]);

      assert(coll.prototype.autoPK);
      assert(coll.prototype.autoCreatedAt);
      assert(coll.prototype.autoUpdatedAt);
    });

    it('should add in timestamps', function() {
      var coll = collectionFn();
      var obj = new Attributes([coll]);
      assert(coll.prototype.attributes.customCreatedAt);
      assert(coll.prototype.attributes.customUpdatedAt);
    });
  });

  describe('with invalid attribute name', function() {
    var collection;

    before(function() {
      collection = function() {};
      collection.prototype = {
        tableName: 'FOO',
        attributes: {
          foo: 'string',
          'foo.bar': 'string'
        }
      };
    });

    it('should error with message', function() {
      assert.throws(
        function() {
          new Attributes([collection]);
        }
      );
    });

  });

});
