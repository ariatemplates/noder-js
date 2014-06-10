/*
 * Copyright 2013 Amadeus s.a.s.
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

// ./$plugin.js and ./notPlugin are supposed to be and stay exactly identical.
var Promise = require("noder-js/promise");
var preloadCalls = [];
var slice = Array.prototype.slice;

var pluginMethod = function() {
    var argsLength = arguments.length;
    outer: for (var i = 0, l = preloadCalls.length; i < l; i++) {
        var curCall = preloadCalls[i];
        var curCallArgs = curCall.args;
        if (curCall.resolved && curCallArgs.length === argsLength) {
            for (var j = 0; j < argsLength; j++) {
                if (arguments[j] !== curCallArgs[j]) {
                    continue outer;
                }
            }
            return true;
        }
    }
    return false;
};

pluginMethod.$preload = function() {
    var deferred = Promise.defer();
    var item = {
        args: slice.call(arguments, 0),
        resolved: false
    };
    setTimeout(function() {
        item.resolved = true;
        deferred.resolve();
    }, 20);
    preloadCalls.push(item);
    return deferred.promise;
};

module.exports = {
    preloadCalls: preloadCalls,
    pluginMethod: pluginMethod
};
