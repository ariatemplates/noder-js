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

var asyncRequire = require('asyncRequire').create(module);
var evalError;

var errorsList = {
    "XMLHttpRequest": function(out, url, xhr) {
        out.push("failed to download from url '", url, "': ", xhr.status, " ", xhr.statusText);
    },
    "moduleLoadDefinition": function(out, module) {
        out.push("failed to load module '", module.filename, "':\n");
        return appendErrorInfo(this.cause, out);
    },
    "modulePreloadDependencies": function(out, module) {
        out.push("failed to preload a dependency of '", module.filename, "':\n");
        return appendErrorInfo(this.cause, out);
    },
    "notPreloaded": function(module) {
        out.push("cannot execute module '", module.filename, "' as it is not preloaded.");
    },
    "jsEval": function(out, jsCode, url, lineDiff) {
        var next = function() {
            if (!evalError) {
                evalError = asyncRequire('./evalError.js');
            }
            var syntaxError = evalError(out, jsCode, url, lineDiff);
            if (!syntaxError) {
                out.push("error while evaluating '" + url + "':\n");
                return appendErrorInfo(this.cause, out);
            }
        };
        if (evalError) {
            return next();
        } else {
            return asyncRequire(['./evalError.js']).then(next);
        }
    },
    "resolverRoot": function(out, path) {
        out.push("trying to go upper than the root of modules when resolving '", path.join('/'), "'");
    },
    "resolverLoop": function(out, path) {
        out.push("inifinite loop when resolving '", path.join('/'), "'");
    }
};

var appendErrorInfo = function(error, out) {
    if (error && error.name == "NoderError") {
        var code = error.code;
        var handler = errorsList[code];
        if (handler) {
            var params = [out].concat(error.args || []);
            return handler.apply(error, params);
        }
    } else {
        out.push(error + "");
    }
};

module.exports = function(async) {
    var self = this;
    var out = ["Noder error #" + self.id + ": "];
    var promise = appendErrorInfo(self, out);
    var next = function() {
        var message = out.join('');
        self.message = self.description = message;
        if (async) {
            console.error("Details about " + message);
        }
    };
    if (promise) {
        async = true;
        return promise.then(next);
    } else {
        next();
    }
};
