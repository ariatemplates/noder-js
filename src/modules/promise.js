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

var extend = require("./extend.js");
var isFunction = require("./type.js").isFunction;
var callListeners = require("./callListeners.js");
var uncaughtError = require("./uncaughtError.js");

var concat = Array.prototype.concat;

var PENDING_STATE = "pending";

var propagateResults = function(callback, deferred) {
    return function() {
        try {
            // the try...catch here is essential for a correct promises implementation
            // see: https://gist.github.com/3889970
            var res = callback.apply(null, arguments);
            if (res && isFunction(res.then)) {
                res.then(deferred.resolve, deferred.reject);
            } else {
                deferred.resolve(res);
            }
        } catch (e) {
            deferred.reject(e);
        } finally {
            callback = null;
            deferred = null;
        }
    };
};

var createPromise = function(fn) {
    var deferred = {};
    var state = PENDING_STATE;
    var result = null;
    var listeners = {};

    var listenersMethods = function(newState) {
        var addCb = function() {
            var curListeners;
            if (state === PENDING_STATE) {
                curListeners = listeners[newState] || [];
                listeners[newState] = concat.apply(curListeners, arguments);
            } else if (state === newState) {
                curListeners = concat.apply([], arguments);
                callListeners(curListeners, result);
            }
            return this;
        };
        var fire = function() {
            if (state !== PENDING_STATE) {
                return;
            }
            result = arguments;
            state = newState;
            var myListeners = listeners[newState];
            listeners = null;
            callListeners(myListeners, result);
        };
        return [addCb, fire];
    };
    var done = listenersMethods("resolved");
    var fail = listenersMethods("rejected");

    var promise = {
        state: function() {
            return state;
        },
        isPending: function() {
            return state == PENDING_STATE;
        },
        always: function() {
            deferred.done.apply(deferred, arguments).fail.apply(deferred, arguments);
            return this;
        },
        done: done[0 /*addCb*/ ],
        fail: fail[0 /*addCb*/ ],
        then: function(done, fail) {
            var res = createPromise();
            deferred.done(isFunction(done) ? propagateResults(done, res) : res.resolve);
            deferred.fail(isFunction(fail) ? propagateResults(fail, res) : res.reject);
            return res.promise();
        },
        promise: function(obj) {
            return obj ? extend(obj, promise) : promise;
        },
        end: function() {
            return deferred.then(createPromise.empty, uncaughtError);
        }
    };
    deferred.resolve = done[1 /*fire*/ ];
    deferred.reject = fail[1 /*fire*/ ];
    promise.promise(deferred);

    if (fn) {
        fn.call(deferred, deferred);
    }
    return deferred;
};

var done = createPromise();
done.resolve();

createPromise.done = done;

createPromise.empty = function() {};

createPromise.noop = function() {
    return done;
};

var countDown = function(state, index) {
    state.counter++;
    return function() {
        if (!state) {
            // already called with this index
            return;
        }
        var array = state.array;
        array[index] = arguments;
        state.counter--;
        if (!state.counter) {
            var promise = state.promise;
            // clean closure variables:
            state.array = null;
            state.promise = null;
            promise.resolve.apply(promise, array);
        }
        // prevent another call with the same index
        state = null;
    };
};

createPromise.when = function() {
    var array = concat.apply([], arguments);
    var promise = createPromise(),
        state, reject;
    for (var i = 0, l = array.length; i < l; i++) {
        var curItem = array[i];
        if (curItem && isFunction(curItem.then)) {
            if (!state) {
                state = {
                    promise: promise,
                    counter: 0,
                    array: array
                };
                reject = promise.reject;
            }
            curItem.then(countDown(state, i), reject);
        }
    }
    if (!state) {
        promise.resolve.apply(promise, array);
    }
    return promise.promise();
};

module.exports = createPromise;
