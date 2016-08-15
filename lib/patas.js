var hash = require('object-hash');

var Patas = function(options) {
    this._init(options);
};

Patas.prototype._init = function(options) {
    if (!options.source) {
        throw new Error('You must assign at least one data source.');
    }

    this.source = options.source;
    this.stores = Array.isArray(options.stores) ? options.stores : [];
    this.defaultTtls = [];

    // default ttl for each store, default: 30s
    for (var i = 0; i < this.stores.length; i++) {
        this.defaultTtls.push(this.stores[i].ttl || 30 * 1000);
    }
};

Patas.prototype.query = function(sql) {
    var query = new Query(this);
    query.sql = sql;

    return query;
};

var Query = function(patas) {
    this.patas = patas;
};

Query.prototype.values = function(values) {
    this.values = values;
    return this;
};

Query.prototype.ttl = function(ttl) {
    this.ttl = ttl;
    return this;
};

Query.prototype.exec = function(queryCallback) {
    var self = this,
        patas = this.patas,
        source = patas.source,
        stores = patas.stores,
        ttl = self.ttl,
        defaultTtls = patas.defaultTtls,
        cacheKey = hash({
            sql: self.sql,
            values: self.values
        });

    // no store
    if (stores.length == 0) {
        return querySource();
    }

    // init ttl
    if (Array.isArray(ttl)) {
        for (var i = 0; i < defaultTtls.length; i++) {
            if (i >= ttl.length) {
                break;
            }
            defaultTtls[i] = ttl[i];
        }
    } else if (ttl) {
        for (var i = 0; i < defaultTtls.length; i++) {
            defaultTtls[i] = ttl;
        }
    }

    var querySource = function(callback) {
        source.query(self.sql, self.values, function(err, result) {
            if (err) {
                return callback(err);
            }

            var cacheValue = JSON.stringify(result, function(key, value) {
                if ((Array.isArray(source.uncacheProps) &&
                        source.uncacheProps.indexOf(key) > -1) || key.lastIndexOf('_', 0) === 0) {
                    value = undefined;
                }
                return value;
            });
            for (var i = 0; i < stores.length; i++) {
                stores[i].set(cacheKey, defaultTtls[i], cacheValue);
            }

            callback(null, result);
        });
    };

    var storeId = 0,
        store = stores[storeId],
        storeValue, storeType;

    var queryStore = function(callback) {
        store.get(cacheKey, function(err, value) {
            if (!err && value) {
                return callback(err, JSON.parse(value), store.name);
            }

            if (++storeId < stores.length) {
                store = stores[storeId];
                queryStore(callback);
            } else {
                callback();
            }
        });
    };

    queryStore(function(err, value, type) {
        if (value) {
            queryCallback(null, value, type);
        } else {
            querySource(queryCallback);
        }
    });
};

module.exports.Patas = Patas;
