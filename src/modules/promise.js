/*
 * Copyright 2012 Amadeus s.a.s.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var isFunction = require("./type.js").isFunction;
var asyncCall = require("./asyncCall.js");
var uncaughtError = require("./uncaughtError.js");

var concat = Array.prototype.concat;

var empty = function() {};

var chainAnswer = function(obj, resolve, reject) {
    if (obj) {
        var then = obj.thenSync || obj.then;
        if (isFunction(then)) {
            then.call(obj, resolve, reject);
            return;
        }
    }
    resolve(obj);
};

var propagateResults = function(callback, deferred) {
    return function() {
        try {
            // the try...catch here is essential for a correct promises implementation
            // see: https://gist.github.com/3889970
            var res = callback.apply(null, arguments);
            // call thenSync if present, otherwise then
            chainAnswer(res, deferred.resolve, deferred.reject);
        } catch (e) {
            deferred.reject(e);
        } finally {
            callback = null;
            deferred = null;
        }
    };
};

var Promise = function() {};

var defer = function() {
    var deferred = {};
    var promise = deferred.promise = new Promise();
    var state; // undefined, "resolve" or "reject"
    var result = null;
    var listeners = {
        resolve: [],
        reject: []
    };

    var createThen = function(sync, applyFunction) {
        promise["then" + sync] = function(onResolve, onReject) {
            var res = defer();
            onResolve = isFunction(onResolve) ? propagateResults(onResolve, res) : res.resolve;
            onReject = isFunction(onReject) ? propagateResults(onReject, res) : res.reject;
            if (listeners) {
                // register listeners
                listeners.resolve.push(onResolve);
                listeners.reject.push(onReject);
            } else {
                // result already known
                applyFunction([state == "resolve" ? onResolve : onReject], result);
            }
            return res.promise;
        };
    };
    createThen("", asyncCall.nextTickApply);
    createThen("Sync", asyncCall.syncApply);

    var createResolveReject = function(resolveOrReject) {
        deferred[resolveOrReject] = function() {
            if (listeners) {
                result = arguments;
                state = resolveOrReject;
                var myListeners = listeners[resolveOrReject];
                listeners = null;
                asyncCall.nextTickApply(myListeners, result);
            }
        };
        return function() {
            return state == resolveOrReject;
        };
    };
    promise.isResolved = createResolveReject("resolve");
    promise.isRejected = createResolveReject("reject");
    promise.result = function() {
        return result && result[0];
    };
    return deferred;
};

Promise.prototype = {
    end: function() {
        return this.thenSync(empty, uncaughtError);
    },
    always: function(cb) {
        this.then(cb, cb);
        return this;
    }
};

var done = defer();
done.resolve();
done = done.promise;

var STATE_DEFERRED = 0;
var STATE_COUNTER = 1;
var STATE_RESULT = 2;
var STATE_OK = 3;
var STATE_FAILFAST = 4;

var countDown = function(state, index) {
    return function(ok) {
        return function(result) {
            if (!state) {
                // already called with this index
                return;
            }
            if (state[STATE_OK]) {
                if (ok) {
                    state[STATE_RESULT][index] = result;
                } else {
                    state[STATE_OK] = false;
                    state[STATE_RESULT] = arguments;
                    if (state[STATE_FAILFAST]) {
                        state[STATE_COUNTER] = 1;
                    }
                }
            }
            state[STATE_COUNTER]--;
            if (!state[STATE_COUNTER]) {
                var defer = state[STATE_DEFERRED];
                var endResult = state[STATE_RESULT];
                // clean closure variables:
                state[STATE_DEFERRED] = state[STATE_RESULT] = null;
                (state[STATE_OK] ? defer.resolve : defer.reject).apply(defer, endResult);
            }
            // prevent another call with the same index
            state = null;
        };
    };
};

var createWhen = function(failFast) {
    return function() {
        var array = concat.apply([], arguments);
        if (!array.length) {
            return done;
        }
        var deferred = defer();
        var state = [
            deferred /* STATE_DEFERRED */ ,
            array.length /* STATE_COUNTER */ ,
            array /* STATE_RESULT */ ,
            true /* STATE_OK */ ,
            failFast /* STATE_FAILFAST */
        ];
        for (var i = 0, l = array.length; i < l; i++) {
            var fn = countDown(state, i);
            chainAnswer(array[i], fn(true), fn(false));
        }
        return deferred.promise;
    };
};

module.exports = {
    defer: defer,
    when: createWhen(true),
    whenAll: createWhen(false),
    empty: empty,
    done: done
};
