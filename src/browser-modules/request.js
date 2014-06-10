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

var Promise = require("../modules/promise.js");
var noderError = require("../modules/noderError.js");
var HttpRequestObject = global.XMLHttpRequest;
var newHttpRequestObject;

if (HttpRequestObject) {
    newHttpRequestObject = function() {
        return new HttpRequestObject();
    };
} else {
    HttpRequestObject = global.ActiveXObject;
    newHttpRequestObject = function() {
        return new HttpRequestObject("Microsoft.XMLHTTP");
    };
}

var createCallback = function(url, xhr, fulfill, reject) {
    return function() {
        if (xhr && xhr.readyState == 4) {
            var error = (xhr.status != 200);
            if (error) {
                reject(noderError('XMLHttpRequest', [url, xhr]));
            } else {
                fulfill(xhr);
            }
            // clean the closure:
            url = xhr = fulfill = reject = null;
            return true;
        }
    };
};

module.exports = function(url, options) {
    return new Promise(function(fulfill, reject) {
        options = options || {};
        var xhr = newHttpRequestObject();
        var headers = options.headers || {};
        xhr.open(options.method || 'GET', url, !options.sync);
        for (var key in headers) {
            if (headers.hasOwnProperty(key)) {
                xhr.setRequestHeader(key, headers[key]);
            }
        }
        xhr.send(options.data);
        var checkState = createCallback(url, xhr, fulfill, reject);
        if (!checkState()) {
            // only set onreadystatechange if it is useful
            // (i.e. the response is not available synchronously)
            xhr.onreadystatechange = checkState;
        }
    });
};
