Waterline Schema
====================

This is the core schema builder used in the Waterline ORM. It is responsible for taking an
attributes object from a Collection and turning it into a fully fledged schema object.

It's mainly tasked with figuring out and expanding associations between Collections.

## Schema Format

A Waterline schema is a javascript object that maps to a generalized database schema format.
An adapter should be able to take it and build out a schema definition including join tables in
a relational database.

#### Belongs To

Belongs to relationships are defined by adding a property to a collection's attributes with a
`model` property that points to another collection.

```javascript
attributes: {
  user: { model: 'user' }
}
```

Should create the following after being run through the schema.

```javascript
attributes: {
  user: {
    columnName: 'user_id',
    type: 'integer',
    foreignKey: true,
    references: 'user',
    on: 'id'
  }
}
```

#### Has Many

Has many relationships are defined by adding a property to a collection's attributes with a
`collection` property that points to another collection. This isn't used for the actual database
structure in a relational system but could be helpful in a nosql database. It is also used
internally inside of Waterline.

```javascript
attributes: {
  users: { collection: 'user' }
}
```

Should create the following after being run through the schema.

```javascript
attributes: {
  users: {
    collection: 'user',
    references: 'user',
    on: 'user_id'
  }
}
```

#### Many To Many

Many To Many relationships are defined by adding a `collection` property on two Collections that
point to each other. This will create an additional collection in the schema that maps out the
relationship between the two. It will rewrite the foreign keys on the two collections to
reference the new join collections.

```javascript
// Foo Collection
attributes: {
  bars: { collection: 'bar' }
}

// Bar Collection
attributes: {
  foos: { collection: 'foo' }
}
```

Should create the following after being run through the schema.

```javascript
// Foo Collection
attributes: {
  id: {
    type: 'integer',
    autoIncrement: true,
    primaryKey: true,
    unique: true
  },
  bars: {
    collection: 'bar_foo',
    references: 'bar_foo',
    on: 'foo_id'
  }
}

// Bar Collection
attributes: {
  id: {
    type: 'integer',
    autoIncrement: true,
    primaryKey: true,
    unique: true
  },
  foos: {
    collection: 'bar_foo',
    references: 'bar_foo',
    on: 'bar_id'
  }
}

// Bar Foo Collection
attributes: {
  bar: {
    columnName: 'bar_id',
    type: 'integer',
    foreignKey: true,
    references: 'bar',
    on: 'id',
    groupKey: 'bar'
  },
  foo: {
    columnName: 'foo_id',
    type: 'integer',
    foreignKey: true,
    references: 'foo',
    on: 'id',
    groupKey: 'foo'
  }
}
```
