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

var merge = require("./merge.js");
var isFunction = require("./type.js").isFunction;
var asyncCall = require("./asyncCall.js");
var uncaughtError = require("./uncaughtError.js");

var concat = Array.prototype.concat;

var PENDING_STATE = "pending";
var RESOLVED_STATE = "resolved";
var REJECTED_STATE = "rejected";

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

var createPromise = function() {
    var deferred = new Promise();
    var promise = new Promise();
    var state = PENDING_STATE;
    var result = null;
    var listeners = {};

    var createMethods = function(doneOrFail, resolveOrReject, newState) {
        var addCb = function(sync, applyFunction) {
            promise[doneOrFail + sync] = function() {
                var curListeners;
                if (state === PENDING_STATE) {
                    curListeners = listeners[newState] || [];
                    listeners[newState] = concat.apply(curListeners, arguments);
                } else if (state === newState) {
                    curListeners = concat.apply([], arguments);
                    applyFunction(curListeners, result);
                }
                return this;
            };
        };
        addCb("", asyncCall.nextTickApply);
        addCb("Sync", asyncCall.syncApply);
        promise[resolveOrReject] = function() {
            if (state !== PENDING_STATE) {
                return;
            }
            result = arguments;
            state = newState;
            var myListeners = listeners[newState];
            listeners = null;
            asyncCall.nextTickApply(myListeners, result);
        };
    };
    createMethods("done", "resolve", RESOLVED_STATE);
    createMethods("fail", "reject", REJECTED_STATE);

    promise.state = function() {
        return state;
    };
    promise.promise = function() {
        return promise;
    };
    merge(deferred, promise);
    return deferred;
};

var promiseProto = createPromise.prototype = Promise.prototype = {
    end: function() {
        return this.thenSync(createPromise.empty, uncaughtError);
    }
};

var createThenAndAlways = function(sync) {
    var doneMethodName = "done" + sync;
    var failMethodName = "fail" + sync;
    promiseProto["then" + sync] = function(done, fail) {
        var res = createPromise();
        this[doneMethodName](isFunction(done) ? propagateResults(done, res) : res.resolve);
        this[failMethodName](isFunction(fail) ? propagateResults(fail, res) : res.reject);
        return res.promise();
    };
    promiseProto["always" + sync] = function() {
        this[doneMethodName].apply(this, arguments);
        this[failMethodName].apply(this, arguments);
        return this;
    };
};

createThenAndAlways("Sync");
createThenAndAlways("");

var done = createPromise();
done.resolve();

createPromise.done = done.promise();

createPromise.empty = function() {};

createPromise.noop = function() {
    return done;
};

var countDown = function(state, index) {
    return function(result) {
        if (!state) {
            // already called with this index
            return;
        }
        var array = state.array;
        array[index] = result;
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
    if (!array.length) {
        return createPromise.done;
    }
    var promise = createPromise();
    var reject = promise.reject;
    var state = {
        promise: promise,
        counter: array.length,
        array: array
    };
    for (var i = 0, l = array.length; i < l; i++) {
        chainAnswer(array[i], countDown(state, i), reject);
    }
    return promise.promise();
};

module.exports = createPromise;
