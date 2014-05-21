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

var asyncRequire = require('noder-js/asyncRequire').create(module);
var promise = require('noder-js/promise');

var errorsList = {
    "XMLHttpRequest": function(out, url, xhr) {
        out.unshift("failed to download '", url, "': ", xhr.status, " ", xhr.statusText, "\n");
        return promise.done;
    },
    "moduleLoadDefinition": function(out, module) {
        out.unshift("failed to load definition of module '", module.filename, "'\n");
        return unshiftErrorInfo(this.cause, out);
    },
    "moduleProcessPlugin": function(out, module, pluginDef) {
        out.unshift("failed to process plugin require('", pluginDef.module, "')." + pluginDef.method + " for module '", module.filename, "'\n");
        return unshiftErrorInfo(this.cause, out);
    },
    "modulePreload": function(out, module) {
        if (module.filename != '.') {
            out.unshift("failed to preload '", module.filename, "'\n");
        }
        return unshiftErrorInfo(this.cause, out);
    },
    "modulePreloadRec": function(out, module) {
        if (module.filename != '.') {
            out.unshift("invalid recursive call to modulePreload '", module.filename, "'\n");
        }
        return promise.done;
    },
    "notPreloaded": function(out, module) {
        out.unshift("cannot execute module '", module.filename, "' as it is not preloaded.\n");
        return this.cause ? unshiftErrorInfo(this.cause, out) : promise.done;
    },
    "jsEval": function(out, jsCode, url /*, prefix, suffix*/ ) {
        return asyncRequire('./evalError.js').thenSync(function(evalError) {
            var syntaxError = evalError(out, jsCode, url);
            if (!syntaxError) {
                out.unshift("error while evaluating '" + url + "'\n");
                return unshiftErrorInfo(this.cause, out);
            }
        });
    },
    "resolverRoot": function(out, path) {
        out.unshift("trying to go upper than the root of modules when resolving '", path.join('/'), "'\n");
        return promise.done;
    },
    "resolverLoop": function(out, path) {
        out.unshift("inifinite loop when resolving '", path.join('/'), "'\n");
        return promise.done;
    }
};

var unshiftErrorInfo = function(error, out) {
    if (error && error.name == "NoderError") {
        var code = error.code;
        var handler = errorsList[code];
        if (handler) {
            var params = [out].concat(error.args || []);
            return handler.apply(error, params);
        }
    } else {
        out.unshift(error + "\n");
    }
    return promise.done;
};

module.exports = function(async) {
    var self = this;
    var out = [];
    var res = unshiftErrorInfo(self, out).thenSync(function() {
        var message = out.join('');
        self.message = self.description = message;
        if (async) {
            console.error("Details about NoderError #" + self.id + ":\n" + message);
        }
    });
    async = true;
    return res;
};
