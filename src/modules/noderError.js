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

var logDetails = function() {
    var async = false;
    var self = this;
    var res = getHandler().thenSync(function(syncLogDetails) {
        return syncLogDetails(self, async);
    });
    async = true;
    return res;
};

var handlerPromise;
var getHandler = function() {
    if (!handlerPromise) {
        var Context = require('./context');
        var errorConfig = require("../unpackaged-modules/packagedConfig")().errorContext;
        var loadingContext = new Context(errorConfig);
        handlerPromise = loadingContext.moduleExecute(loadingContext.getModule(errorConfig.main));
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
    error.logDetails = logDetails;
    return error;
};

module.exports = createError;
