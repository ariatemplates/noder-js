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
var errorNb = 0;

var syncLogDetails;
var asyncLogDetails = function() {
    var self = this;
    if (syncLogDetails) {
        return syncLogDetails.call(self);
    }
    return getHandler().then(function() {
        return syncLogDetails.call(self, true);
    });
};

var handlerPromise;
var getHandler = function() {
    if (!handlerPromise) {
        var Context = require('./context');
        var scriptBaseUrl = require('../node-modules/scriptBaseUrl');
        var loadingContext = new Context({
            packaging: {
                baseUrl: scriptBaseUrl()
            }
        });
        handlerPromise = loadingContext.moduleExecute(loadingContext.getModule("noderError/error.js")).then(function(
            receivedHandler) {
            // changes the logDetails function for next time
            syncLogDetails = receivedHandler;
        });
    }
    return handlerPromise;
};

var createError = function(code, args, cause) {
    var id = ++errorNb;
    var error = new Error("NoderError #" + id + ": " + code);
    error.name = "NoderError";
    error.id = id;
    error.code = code;
    error.args = args;
    error.cause = cause;
    error.logDetails = syncLogDetails || asyncLogDetails;
    return error;
};

module.exports = createError;
