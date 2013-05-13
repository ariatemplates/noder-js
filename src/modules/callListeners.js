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

module.exports = function(listeners, result) {
    if (listeners && listeners.length) {
        nextTick(function() {
            for (var i = 0, l = listeners.length; i < l; i++) {
                var curItem = listeners[i];
                try {
                    curItem.apply(null, result);
                } catch (e) {
                    uncaughtError(e);
                }
            }
            listeners = null;
            result = null;
        });
    }
};
