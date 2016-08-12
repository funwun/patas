var hash = require('object-hash');

var Patas = function(options) {
    this._init(options);
};

Patas.prototype._init = function(options) {
    this.source = options.source;
    this.stores = Array.isArray(options.stores) ? options.stores : [];
    this.ttls = [];
    for (var i = 0; i < this.stores.length; i++) {
        this.ttls.push(this.stores[i].ttl || 30 * 1000);
    }
};

Patas.prototype.query = function(sql, params, p1, p2) {
    if (typeof(p1) == 'function') {
        ttl = null;
        queryCallback = p1;
    } else {
        ttl = p1;
        queryCallback = p2;
    }
    var self = this,
        source = self.source,
        stores = self.stores,
        ttls = self.ttls,
        cacheKey = hash({
            sql: sql,
            params: params
        });

    if (!source) {
        return queryCallback(new Error('Data source not found.'));
    }

    // init ttls
    if (Array.isArray(ttl)) {
        for (var i = 0; i < ttls.length; i++) {
            if (i >= ttl.length) {
                break;
            }
            ttls[i] = ttl[i];
        }
    } else if (ttl) {
        for (var i = 0; i < ttls.length; i++) {
            ttls[i] = ttl;
        }
    }

    var querySource = function(callback) {
        source.query(sql, params, function(err, result) {
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
                stores[i].set(cacheKey, ttls[i], cacheValue);
            }

            callback(null, result);
        });
    };

    // no store
    if (stores.length == 0) {
        return querySource();
    }

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
}

module.exports.Patas = Patas;
