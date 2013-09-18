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

var nextTick = require("../node-modules/nextTick.js");
var uncaughtError = require("./uncaughtError.js");
var handlers = [];
var insideSyncTick = false;

var apply = function(callbacks, params, scope) {
    while (callbacks.length > 0) {
        var method = callbacks.shift();
        try {
            method.apply(scope, params);
        } catch (e) {
            uncaughtError(e);
        }
    }
};

var syncTick = function() {
    insideSyncTick = true;
    try {
        apply(handlers, []);
    } finally {
        insideSyncTick = false;
    }
};

var improvedNextTick = function(fn) {
    if (handlers.length === 0 && !insideSyncTick) {
        nextTick(syncTick);
    }
    handlers.push(fn);
};

module.exports = {
    syncTick: syncTick,
    nextTick: improvedNextTick,
    nextTickApply: function(callbacks, params, scope) {
        if (callbacks && callbacks.length > 0) {
            improvedNextTick(function() {
                apply(callbacks, params, scope);
            });
        }
    },
    syncApply: apply
};
