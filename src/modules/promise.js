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

var typeUtils = require("./type.js");
var isFunction = typeUtils.isFunction;
var isObject = typeUtils.isObject;
var asyncCall = require("./asyncCall.js");
var uncaughtError = require("./uncaughtError.js");
var bind1 = require("./bind1");

var wrapResolutionFn = function(resFn, promiseError) {
    var called;
    var checkCalls = function(fn, value) {
        if (!called) {
            called = true;
            fn(value);
        }
    };
    return [bind1(checkCalls, null, function(value) {
        if (promiseError && value === promiseError) {
            resFn[1](new TypeError());
            return;
        }
        chainAnswer(value, resFn);
    }), bind1(checkCalls, null, resFn[1])];
};

var chainAnswer = function(value, resFn) {
    try {
        if (isFunction(value) || isObject(value)) {
            var then = value.thenSync || value.then;
            if (isFunction(then)) {
                resFn = wrapResolutionFn(resFn);
                then.call(value, resFn[0], resFn[1]);
                return;
            }
        }
        resFn[0](value);
    } catch (ex) {
        resFn[1](ex);
    }
};

var Promise = function(callback) {
    var promise = this;
    var state; // undefined = pending, 1 fulfilled, 2 rejected
    var result;
    var listeners = [];

    var createThen = function(sync, callFunction) {
        promise["then" + sync] = function(onFulfilled, onRejected) {
            onFulfilled = isFunction(onFulfilled) ? onFulfilled : null;
            onRejected = isFunction(onRejected) ? onRejected : null;
            if (!onFulfilled && !onRejected) {
                return promise; // skips the creation of a useless promise
            }
            return new Promise(function(fulfill, reject) {
                var callback = function() {
                    var fn = state == 1 ? onFulfilled : onRejected;
                    if (fn) {
                        try {
                            fulfill(fn(result));
                        } catch (e) {
                            reject(e);
                        }
                    } else {
                        (state == 1 ? fulfill : reject)(result);
                    }
                };
                if (listeners) {
                    listeners.push(callback);
                } else {
                    callFunction(callback);
                }
            });
        };
    };
    createThen("", asyncCall.nextTick);
    createThen("Sync", asyncCall.syncCall);

    var isX = function(refState) {
        return state == refState;
    };
    promise.isFulfilled = bind1(isX, null, 1);
    promise.isRejected = bind1(isX, null, 2);
    promise.result = function() {
        return result;
    };

    var resolve = function(newState, value) {
        if (listeners) {
            result = value;
            state = newState;
            var myListeners = listeners;
            listeners = null;
            asyncCall.nextTickCalls(myListeners);
        }
    };
    var resFn = [bind1(resolve, null, 1), bind1(resolve, null, 2)];
    resFn = wrapResolutionFn(resFn, promise);
    try {
        callback(resFn[0], resFn[1]);
    } catch (e) {
        resFn[1](e);
    }
};

Promise.resolve = function(value) {
    if (value instanceof Promise) {
        return value;
    }
    return new Promise(function(fulfill) {
        fulfill(value);
    });
};

Promise.reject = function(reason) {
    return new Promise(function(fulfill, reject) {
        reject(reason);
    });
};

Promise.defer = function() {
    var res = {};
    res.promise = new Promise(function(fulfill, reject) {
        res.resolve = fulfill;
        res.reject = reject;
    });
    return res;
};

Promise.done = Promise.resolve();

var promiseProto = Promise.prototype = {};

var wrapForSpread = function(onFulfilled, res) {
    return onFulfilled.apply(null, res);
};

var createProtoMethods = function(sync) {
    var thenSync = "then" + sync;
    promiseProto["spread" + sync] = function(onFulfilled, onRejected) {
        return this[thenSync](bind1(wrapForSpread, null, onFulfilled), onRejected);
    };
    promiseProto["catch" + sync] = function(onRejected) {
        return this[thenSync](null, onRejected);
    };
    promiseProto["finally" + sync] = function(handler) {
        return this[thenSync](handler, handler);
    };
    promiseProto["done" + sync] = function(onFulfilled, onRejected) {
        this[thenSync](onFulfilled, onRejected).thenSync(null, uncaughtError);
    };
};

createProtoMethods("");
createProtoMethods("Sync");

var createAll = function(failFast) {
    return function(array) {
        return new Promise(function(fulfill, reject) {
            if (array.length === 0) {
                return fulfill([]);
            }
            array = array.slice(0); // make a copy of the array (to be able to change it)
            var globalOk = true;
            var globalResult = array;
            var remainingPromisesCount = array.length;
            var handler = function(success, result) {
                array[this[0]] = result;
                if (globalOk && !success) {
                    globalOk = false;
                    globalResult = result;
                    if (failFast) {
                        remainingPromisesCount = 1;
                    }
                }
                remainingPromisesCount--;
                if (!remainingPromisesCount) {
                    (globalOk ? fulfill : reject).call(null, globalResult);
                }
            };
            for (var i = remainingPromisesCount - 1; i >= 0; i--) {
                var scope = [i];
                chainAnswer(array[i], [bind1(handler, scope, true), bind1(handler, scope, false)]);
            }
        });
    };
};

Promise.all = createAll(true);
Promise.allSettled = createAll(false);

module.exports = Promise;
