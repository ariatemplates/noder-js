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

var promise = require('../modules/promise.js');
var domReadyPromise;
var createDomReadyPromise = function() {
    var document = global.document;
    if (!document || document.readyState === "complete") {
        // in this simple case, avoid creating a new promise, just use promise.done
        return promise.done;
    }
    var res = promise();
    var callback = function() {
        if (res) {
            res.resolve(); // resolve with no parameter
        }
    };
    if (document.addEventListener) {
        document.addEventListener("DOMContentLoaded", callback, false);
        // Fallback in case the browser does not support DOMContentLoaded:
        global.addEventListener("load", callback, false);
        res.always(function() {
            // clean the closure and listeners
            document.removeEventListener("DOMContentLoaded", callback, false);
            global.removeEventListener("load", callback, false);
            document = null;
            callback = null;
            res = null;
        });
    } else if (document.attachEvent) {
        // Fallback to the onload event on IE:
        global.attachEvent("onload", callback);
        res.always(function() {
            // clean the closure and listeners
            global.detachEvent("onload", callback);
            document = null;
            callback = null;
            res = null;
        });
    }
    return res.promise();
};

module.exports = function() {
    if (!domReadyPromise) {
        domReadyPromise = createDomReadyPromise();
    }
    return domReadyPromise;
};
