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

var Promise = require('../modules/promise.js');
var domReadyPromise;
var createDomReadyPromise = function() {
    return new Promise(function(fulfill) {
        var document = global.document;
        if (!document || document.readyState === "complete") {
            return fulfill();
        }
        var cleanUp;
        var callback = function() {
            fulfill(); // call fulfill with no parameter
            cleanUp();
            document = cleanUp = callback = null;
        };
        if (document.addEventListener) {
            cleanUp = function() {
                // clean the closure and listeners
                document.removeEventListener("DOMContentLoaded", callback, false);
                global.removeEventListener("load", callback, false);
            };
            document.addEventListener("DOMContentLoaded", callback, false);
            // Fallback in case the browser does not support DOMContentLoaded:
            global.addEventListener("load", callback, false);
        } else if (document.attachEvent) {
            cleanUp = function() {
                // clean the closure and listeners
                global.detachEvent("onload", callback);
            };
            // Fallback to the onload event on IE:
            global.attachEvent("onload", callback);
        }
    });
};

module.exports = function() {
    if (!domReadyPromise) {
        domReadyPromise = createDomReadyPromise();
    }
    return domReadyPromise;
};
