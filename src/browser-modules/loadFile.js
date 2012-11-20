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

var promise = require("../modules/promise.js");
var HttpRequestObject = global.XMLHttpRequest;
var newHttpRequestObject;

if (HttpRequestObject) {
    newHttpRequestObject = function () {
        return new HttpRequestObject();
    };
} else {
    HttpRequestObject = global.ActiveXObject;
    newHttpRequestObject = function () {
        return new HttpRequestObject("Microsoft.XMLHTTP");
    };
}

var createCallback = function (url, xhr, deferred) {
    return function () {
        if (xhr && xhr.readyState == 4) {
            var error = (xhr.status != 200);
            if (error) {
                deferred.reject(new Error(['Error while fetching ', url, '\n', xhr.status, ' ', xhr.statusText].join('')));
            } else {
                deferred.resolve(xhr.responseText);
            }
            // clean the closure:
            url = xhr = deferred = null;
        }
    };
};

module.exports = function (url) {
    var deferred = promise();
    var xhr = newHttpRequestObject();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = createCallback(url, xhr, deferred);
    // Note that, on IE, onreadystatechange can be called during the call to send
    xhr.send(null);
    return deferred.promise();
};