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

var document = global.document;
var config = {};

// When not in the loading mode, it is not reliable to use the last script to find the configuration
if (document.readyState == "loading") {
    var scripts = document.getElementsByTagName('script');
    var scriptTag = scripts[scripts.length - 1];
    if (scriptTag) {
        var src = scriptTag.src;
        // if there is no src, it cannot be the right script tag anyway
        if (src) {
            var exec = require('./eval.js');
            var configContent = scriptTag.innerHTML;
            if (!/^\s*$/.test(configContent)) {
                config = exec(configContent) || config;
            }

            if (!config.main) {
                var questionMark = src.indexOf('?');
                if (questionMark > -1) {
                    config.main = decodeURIComponent(src.substring(questionMark + 1));
                }
            }
        }
    }
}

module.exports = config;
