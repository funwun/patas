# Flexible Node.js database cache module

A cache module for node.js database

## Installation
```bash
npm install patas
```

## Data Source Engines
* [patas-source-pgsql](
    https://github.com/funwun/patas-source-pgsql)

## Cache Store Engines
* [patas-store-memory-lru](
    https://github.com/funwun/patas-store-memory-lru)

* [patas-store-redis](
    https://github.com/funwun/patas-store-redis)

## Usage Example
```javascript
// require modules
var Patas = require('patas').Patas,
    pgsqlSource = require('patas-source-pgsql'),
    redisStore = require('patas-store-redis'),
    memoryLruStore = require('patas-store-memory-lru');

// create postgresql source
var source = pgsqlSource({
    host: '192.168.28.155',
    user: 'postgres', //env var: PGUSER
    database: 'test', //env var: PGDATABASE
    password: 'test', //env var: PGPASSWORD
    port: 5432, //env var: PGPORT
    max: 10, // max number of clients in the pool
    idleTimeoutMillis: 30000 // how long a client is allowed to remain idle before being closed
});

// create memory lru store
var store1 =  memoryLruStore({
    prefix: 'test-',
    ttl: 30000, // default: 30 * 1000
    size: 1024 * 1024 * 10 // max store size (bytes)
});

// create redis store
var store2 = redisStore({
    prefix: 'test-',
    ttl: 30000,  // default: 30 * 1000
    host: '192.168.28.155', // default
    port: 6379, //default
    minClients: 2, // defalut
    maxClients: 30, // defalut
    idleTimeoutMillis: 60000 * 60 * 24,
    database: 0 // database number to use
});

// create patas with source and stores
var patas = new Patas({
    source: source,
    stores: [store1, store2]
});

var query = function(callback) {
    var sql = 'SELECT $1::int AS p1, $2::int AS p2;';
    var params = [1, 2];
    var ttl = 10000; // 10s

    // you can use a integer array for each store:
    //var ttl = [500, 1500];

    patas.query(sql).values(params).ttl(ttl).exec(function(err, result, cacheName) {
        if (err) throw err;

        console.log('result:', cacheName, result);
        callback();
    });
};

query(function() {
    setTimeout(function() {
        query(function() {
            process.exit(0);
        });
    }, 1000);
});

```
This will display:

```
result: undefined { command: 'SELECT',
  rowCount: 1,
  oid: NaN,
  rows: [ anonymous { p1: 1, p2: 2 } ],
  fields:
   [ { name: 'p1',
       tableID: 0,
       columnID: 0,
       dataTypeID: 23,
       dataTypeSize: 4,
       dataTypeModifier: -1,
       format: 'text' },
     { name: 'p2',
       tableID: 0,
       columnID: 0,
       dataTypeID: 23,
       dataTypeSize: 4,
       dataTypeModifier: -1,
       format: 'text' } ],
  _parsers: [ [Function], [Function] ],
  RowCtor: [Function: anonymous],
  rowAsArray: false,
  _getTypeParser: [Function: bound ] }

result: memory-lru { command: 'SELECT',
  rowCount: 1,
  oid: null,
  rows: [ { p1: 1, p2: 2 } ],
  fields:
   [ { name: 'p1',
       tableID: 0,
       columnID: 0,
       dataTypeID: 23,
       dataTypeSize: 4,
       dataTypeModifier: -1,
       format: 'text' },
     { name: 'p2',
       tableID: 0,
       columnID: 0,
       dataTypeID: 23,
       dataTypeSize: 4,
       dataTypeModifier: -1,
       format: 'text' } ],
  rowAsArray: false }
```

## API

### Patas

#### `constructor Patas({source: Object, stores: Array})`

Constructs and returns a new `Patas` instance.

`source` Database source engine to query original data, get detail from the [Data Source Engines](https://github.com/funwun/patas#data-source-engines) list.

`stores` Array list of cache stores, get detail from the [Cache Store Engines](https://github.com/funwun/patas#cache-store-engines) list.

```javascript
var patas = new Patas({
    source: source,
    stores: [store1, store2]
});
```

#### `patas.query(sql:string)`

Returns a new `Query` instance. You must supply the SQL statement via `sql` parameter.

```javascript
var query = patas.query('SELECT $1::int AS p1, $2::int AS p2;');
```

### Query

#### `query.values(params:Array) -> query:Query`
Set parameter values of query. All values are passed to the source database backend server and executed as a parameterized statement.
```javascript
query = query.values([1, 2]);
```

#### `query.ttl(ttl:Array) -> query:Query`
Set TTL(Time to live) for each cache store, overwrite default TTL of `patas.stores[n].ttl`.
```javascript
// set 1st store TTL to 500ms, 2nd to 1.5s of current query
query = query.ttl([500, 1500]);

// set all stores TTL to 1.5s of current query
query = query.ttl(1500);
```

#### `query.exec(callback:function(err:Error, result:Object, <cacheName:string>))`
Execute query, if the data is found in the cache store, it returns the data from the cache store, otherwise it returns the data from source database. It will save the database query result to cache store with expired time (TTL). The `cacheName` is cache store name of data returned, default is `undefined`(from database source, no cache). Calls the callback with an Error if there was an error.

```javascript
query.exec(function(err, result, cacheName) {
    if (err) throw err;
    console.log('result:', cacheName, result);
    callback();
});
```

## License

The MIT License (MIT) Copyright (c) 2016 Lewis Deng &lt;kekuer@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
