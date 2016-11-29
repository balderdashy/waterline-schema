var assert = require('assert');
var SchemaBuilder = require('../lib/waterline-schema/schema');

describe('Schema Builder :: ', function() {

  describe('Validating Identity', function() {
    it('should throw an error when a collection is missing an identity', function() {
      var collection = function() {};
      collection.prototype = {
        primaryKey: 'id',
        attributes: {
          id: {
            type: 'number'
          }
        }
      };

      assert.throws(
        function() {
          SchemaBuilder([collection]);
        }
      );
    });

    it('should be valid when an identity is present', function() {
      var collection = function() {};
      collection.prototype = {
        identity: 'FOO',
        primaryKey: 'id',
        attributes: {
          id: {
            type: 'number'
          }
        }
      };

      assert.doesNotThrow(
        function() {
          SchemaBuilder([collection]);
        }
      );
    });

    it('should allow tableName to suffice for identity', function() {
      var collection = function() {};
      collection.prototype = {
        tableName: 'foo',
        primaryKey: 'id',
        attributes: {
          id: {
            type: 'number'
          }
        }
      };

      assert.doesNotThrow(
        function() {
          SchemaBuilder([collection]);
        }
      );
    });
  });


  describe('Validating Primary Key', function() {
    it('should enforce a primary key attribute to be included', function() {
      var collection = function() {};
      collection.prototype = {
        identity: 'foo',
        attributes: {}
      };

      assert.throws(
        function() {
          SchemaBuilder([collection]);
        }
      );
    });

    it('should allow the primary key to be set as a model option', function() {
      var collection = function() {};
      collection.prototype = {
        identity: 'foo',
        primaryKey: 'bar',
        attributes: {
          bar: {
            type: 'string'
          }
        }
      };

      assert.doesNotThrow(
        function() {
          SchemaBuilder([collection]);
        }
      );
    });

    it('should NOT allow the primary key to be set as a flag on an attribute', function() {
      var collection = function() {};
      collection.prototype = {
        identity: 'foo',
        attributes: {
          bar: {
            type: 'string'
          },
          baz: {
            type: 'number',
            primaryKey: true
          }
        }
      };

      assert.throws(
        function() {
          SchemaBuilder([collection]);
        }
      );
    });
  });


  describe('Validating Instance Methods', function() {
    it('should not allow instance methods', function() {
      var collection = function() {};
      collection.prototype = {
        identity: 'foo',
        primaryKey: 'id',
        attributes: {
          id: {
            type: 'number'
          },

          getName: function() {}
        }
      };

      assert.throws(
        function() {
          SchemaBuilder([collection]);
        }
      );
    });
  });


  describe('Validating Attribute Properties', function() {
    it('should not allow migration attributes', function() {
      var collection = function() {};
      collection.prototype = {
        identity: 'foo',
        primaryKey: 'id',
        attributes: {
          id: {
            type: 'number',
            unique: true
          }
        }
      };

      assert.throws(
        function() {
          SchemaBuilder([collection]);
        }
      );
    });

    it('should allow types', function() {
      var collection = function() {};
      collection.prototype = {
        identity: 'foo',
        primaryKey: 'id',
        attributes: {
          id: {
            type: 'number'
          }
        }
      };

      assert.doesNotThrow(
        function() {
          SchemaBuilder([collection]);
        }
      );
    });

    it('should validate types', function() {
      var collection = function() {};
      collection.prototype = {
        identity: 'foo',
        primaryKey: 'id',
        attributes: {
          id: {
            type: 'integer'
          }
        }
      };

      assert.throws(
        function() {
          SchemaBuilder([collection]);
        }
      );
    });

    it('should add a required flag', function() {
      var collection = function() {};
      collection.prototype = {
        identity: 'foo',
        primaryKey: 'id',
        attributes: {
          id: {
            type: 'number'
          },
          name: {
            type: 'string'
          }
        }
      };

      assert.doesNotThrow(
        function() {
          SchemaBuilder([collection]);
        }
      );

      var schema = SchemaBuilder([collection]);
      assert.equal(schema.foo.attributes.name.required, false);
    });
  });


  describe('Validating Attribute Names', function() {
    it('should not allow dots in attribute names', function() {
      var collection = function() {};
      collection.prototype = {
        identity: 'foo',
        primaryKey: 'id',
        attributes: {
          id: {
            type: 'number'
          },
          'name.foo': {
            type: 'number'
          }
        }
      };

      assert.throws(
        function() {
          SchemaBuilder([collection]);
        }
      );
    });
  });
});
