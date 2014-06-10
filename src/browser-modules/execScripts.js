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
var uncaughtError = require("../modules/uncaughtError.js");
var domReady = require('./domReady.js');
var bind1 = require("../modules/bind1.js");

var logErrorsAndContinue = function(p) {
    return p.thenSync(function() {}, uncaughtError);
};

module.exports = function(context, scriptType) {
    return logErrorsAndContinue(domReady().then(function() {
        var document = global.document;
        var executePromise = Promise.done;
        if (document) {
            var scripts = document.getElementsByTagName('script');
            var i, l;
            for (i = 0, l = scripts.length; i < l; i++) {
                var curScript = scripts[i];
                if (curScript.type === scriptType) {
                    var filename = curScript.getAttribute('data-filename');
                    // the try ... catch here allows to go on with the execution of script tags
                    // even if one has a syntax error
                    try {
                        // all scripts are defined before any is executed
                        // so that it is possible to require one script tag from another (in any order)
                        var curModule = context.jsModuleDefine(curScript.innerHTML, filename);
                        executePromise = logErrorsAndContinue(executePromise.then(bind1(context.moduleExecute, context, curModule)));
                    } catch (error) {
                        uncaughtError(error);
                    }
                }
            }
        }
        return executePromise;
    }));
};
