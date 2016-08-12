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
    var sql = 'SELECT $1, $2';
    var params = [1, 2];
    var ttl = 10000; // you can use a integer array for each store
    patas.query(sql, params, ttl, function(err, result, cacheName) {
        if (err) throw err;

        console.log('result:', cacheName, result);
        callback();
    });
};

// query data
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
  rows: [ anonymous { id: 1, name: 'test' } ],
  fields:
   [ { name: 'id',
       tableID: 24830,
       columnID: 1,
       dataTypeID: 23,
       dataTypeSize: 4,
       dataTypeModifier: -1,
       format: 'text' },
     { name: 'name',
       tableID: 24830,
       columnID: 2,
       dataTypeID: 1043,
       dataTypeSize: -1,
       dataTypeModifier: 132,
       format: 'text' } ],
  _parsers: [ [Function], [Function: noParse] ],
  RowCtor: [Function: anonymous],
  rowAsArray: false,
  _getTypeParser: [Function: bound ] }

result: memory-lru { command: 'SELECT',
  rowCount: 1,
  oid: null,
  rows: [ { id: 1, name: 'test' } ],
  fields:
   [ { name: 'id',
       tableID: 24830,
       columnID: 1,
       dataTypeID: 23,
       dataTypeSize: 4,
       dataTypeModifier: -1,
       format: 'text' },
     { name: 'name',
       tableID: 24830,
       columnID: 2,
       dataTypeID: 1043,
       dataTypeSize: -1,
       dataTypeModifier: 132,
       format: 'text' } ],
  rowAsArray: false }
```

## Options
* `source` Database source engine to query original data, get detail from the above `Data Source Engines` list.

* `stores` Array list of cache stores, get detail from the above `Cache Store Engines` list

## API
* `query(sql, params, [ttl,] callback)`

 Query data, if the data is found in the store it return cached data, else return the database query result. It will cache the database query result to store with exipred time (ttl) auto.
 ```javascript
 patas.query('SELECT $1', [1], 1000, function(err, result, cacheName) {
     if (err) throw err;
     console.log('result:', cacheName, result);
 }
 ```

 ## License

 The MIT License (MIT) Copyright (c) 2016 Lewis Deng &lt;kekuer@gmail.com&gt;

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
