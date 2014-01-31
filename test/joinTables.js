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
          bars: {
            collection: 'bar',
            via: 'foos'
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
          },
          foos: {
            collection: 'foo',
            via: 'bars'
          }
        }
      };
    });

    it('should add a junction table for a many to many relationship', function() {
      var obj = new JoinTables(collections);

      assert(obj.foo_bars__bar_foos);
      assert(obj.foo_bars__bar_foos.identity === 'foo_bars__bar_foos');
      assert(obj.foo_bars__bar_foos.tables.indexOf('bar') > -1);
      assert(obj.foo_bars__bar_foos.tables.indexOf('foo') > -1);
      assert(obj.foo_bars__bar_foos.junctionTable === true);


      assert(obj.foo_bars__bar_foos.attributes.foo_bars);
      assert(obj.foo_bars__bar_foos.attributes.foo_bars.type === 'integer');
      assert(obj.foo_bars__bar_foos.attributes.foo_bars.columnName === 'foo_bars');
      assert(obj.foo_bars__bar_foos.attributes.foo_bars.foreignKey === true);
      assert(obj.foo_bars__bar_foos.attributes.foo_bars.references === 'foo');
      assert(obj.foo_bars__bar_foos.attributes.foo_bars.on === 'id');
      assert(obj.foo_bars__bar_foos.attributes.foo_bars.groupKey === 'foo');

      assert(obj.foo_bars__bar_foos.attributes.bar_foos);
      assert(obj.foo_bars__bar_foos.attributes.bar_foos.type === 'integer');
      assert(obj.foo_bars__bar_foos.attributes.bar_foos.columnName === 'bar_foos');
      assert(obj.foo_bars__bar_foos.attributes.bar_foos.foreignKey === true);
      assert(obj.foo_bars__bar_foos.attributes.bar_foos.references === 'bar');
      assert(obj.foo_bars__bar_foos.attributes.bar_foos.on === 'id');
      assert(obj.foo_bars__bar_foos.attributes.bar_foos.groupKey === 'bar');
    });

    it('should update the parent collection to point to the join table', function() {
      var obj = new JoinTables(collections);

      assert(obj.foo.attributes.bars.references === 'foo_bars__bar_foos');
      assert(obj.foo.attributes.bars.on === 'foo_bars');

      assert(obj.bar.attributes.foos.references === 'foo_bars__bar_foos');
      assert(obj.bar.attributes.foos.on === 'bar_foos');
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
          bars: {
            collection: 'bar',
            via: 'foos'
          }
        }
      };

      collections.bar = {
        tableName: 'bar',
        attributes: {
          area: {
            type: 'integer',
            primaryKey: true
          },
          foos: {
            collection: 'foo',
            via: 'bars'
          }
        }
      };
    });

    it('should add a junction table for a many to many relationship', function() {
      var obj = new JoinTables(collections);

      assert(obj.foo_bars__bar_foos);
      assert(obj.foo_bars__bar_foos.identity === 'foo_bars__bar_foos');
      assert(obj.foo_bars__bar_foos.tables.indexOf('bar') > -1);
      assert(obj.foo_bars__bar_foos.tables.indexOf('foo') > -1);
      assert(obj.foo_bars__bar_foos.junctionTable === true);


      assert(obj.foo_bars__bar_foos.attributes.foo_bars);
      assert(obj.foo_bars__bar_foos.attributes.foo_bars.type === 'string');
      assert(obj.foo_bars__bar_foos.attributes.foo_bars.columnName === 'foo_bars');
      assert(obj.foo_bars__bar_foos.attributes.foo_bars.foreignKey === true);
      assert(obj.foo_bars__bar_foos.attributes.foo_bars.references === 'foo');
      assert(obj.foo_bars__bar_foos.attributes.foo_bars.on === 'uuid');
      assert(obj.foo_bars__bar_foos.attributes.foo_bars.groupKey === 'foo');

      assert(obj.foo_bars__bar_foos.attributes.bar_foos);
      assert(obj.foo_bars__bar_foos.attributes.bar_foos.type === 'integer');
      assert(obj.foo_bars__bar_foos.attributes.bar_foos.columnName === 'bar_foos');
      assert(obj.foo_bars__bar_foos.attributes.bar_foos.foreignKey === true);
      assert(obj.foo_bars__bar_foos.attributes.bar_foos.references === 'bar');
      assert(obj.foo_bars__bar_foos.attributes.bar_foos.on === 'area');
      assert(obj.foo_bars__bar_foos.attributes.bar_foos.groupKey === 'bar');
    });
  });

});
