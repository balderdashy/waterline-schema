var JoinTables = require('../lib/waterline-schema/joinTables'),
    assert = require('assert');

describe('JoinTables', function() {

  describe('auto mapping of foreign keys', function() {
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
          bars: { collection: 'bar' }
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
          },
          foos: { collection: 'foo' }
        }
      };
    });

    it('should add a junction table for a many to many relationship', function() {
      var obj = new JoinTables(collections);

      assert(obj.bar_foo);
      assert(obj.bar_foo.identity === 'bar_foo');
      assert(obj.bar_foo.tables.indexOf('bar') > -1);
      assert(obj.bar_foo.tables.indexOf('foo') > -1);
      assert(obj.bar_foo.junctionTable === true);


      assert(obj.bar_foo.attributes.foo);
      assert(obj.bar_foo.attributes.foo.type === 'integer');
      assert(obj.bar_foo.attributes.foo.columnName === 'foo_id');
      assert(obj.bar_foo.attributes.foo.foreignKey === true);
      assert(obj.bar_foo.attributes.foo.references === 'foo');
      assert(obj.bar_foo.attributes.foo.on === 'id');
      assert(obj.bar_foo.attributes.foo.groupKey === 'foo');

      assert(obj.bar_foo.attributes.bar);
      assert(obj.bar_foo.attributes.bar.type === 'integer');
      assert(obj.bar_foo.attributes.bar.columnName === 'bar_id');
      assert(obj.bar_foo.attributes.bar.foreignKey === true);
      assert(obj.bar_foo.attributes.bar.references === 'bar');
      assert(obj.bar_foo.attributes.bar.on === 'id');
      assert(obj.bar_foo.attributes.bar.groupKey === 'bar');
    });

    it('should update the parent collection to point to the join table', function() {
      var obj = new JoinTables(collections);

      assert(obj.foo.attributes.bars.references === 'bar_foo');
      assert(obj.foo.attributes.bars.on === 'foo_id');

      assert(obj.bar.attributes.foos.references === 'bar_foo');
      assert(obj.bar.attributes.foos.on === 'bar_id');
    });
  });


  describe('mapping of custom foreign keys', function() {
    var collections = {};

    before(function() {

      collections.foo = {
        tableName: 'foo',
        attributes: {
          uuid: {
            type: 'string',
            primaryKey: true
          },
          bars: { collection: 'bar' }
        }
      };

      collections.bar = {
        tableName: 'bar',
        attributes: {
          area: {
            type: 'integer',
            primaryKey: true
          },
          foos: { collection: 'foo' }
        }
      };
    });

    it('should add a junction table for a many to many relationship', function() {
      var obj = new JoinTables(collections);

      assert(obj.bar_foo);
      assert(obj.bar_foo.identity === 'bar_foo');
      assert(obj.bar_foo.tables.indexOf('bar') > -1);
      assert(obj.bar_foo.tables.indexOf('foo') > -1);
      assert(obj.bar_foo.junctionTable === true);


      assert(obj.bar_foo.attributes.foo);
      assert(obj.bar_foo.attributes.foo.type === 'string');
      assert(obj.bar_foo.attributes.foo.columnName === 'foo_uuid');
      assert(obj.bar_foo.attributes.foo.foreignKey === true);
      assert(obj.bar_foo.attributes.foo.references === 'foo');
      assert(obj.bar_foo.attributes.foo.on === 'uuid');
      assert(obj.bar_foo.attributes.foo.groupKey === 'foo');

      assert(obj.bar_foo.attributes.bar);
      assert(obj.bar_foo.attributes.bar.type === 'integer');
      assert(obj.bar_foo.attributes.bar.columnName === 'bar_area');
      assert(obj.bar_foo.attributes.bar.foreignKey === true);
      assert(obj.bar_foo.attributes.bar.references === 'bar');
      assert(obj.bar_foo.attributes.bar.on === 'area');
      assert(obj.bar_foo.attributes.bar.groupKey === 'bar');
    });
  });

});
