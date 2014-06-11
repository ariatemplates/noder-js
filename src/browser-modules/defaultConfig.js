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

var merge = require("../modules/merge");
var config = require("../unpackaged-modules/packagedConfig")().mainContext;
var scriptTag = require('./scriptTag.js');
var src = scriptTag.src;
if (src) {
    // only read the script config if the script tag has an src attribute
    var configContent = scriptTag.innerHTML;
    if (!/^\s*$/.test(configContent || "")) {
        var exec = require('./eval.js');
        var scriptConfig = exec(configContent);
        merge(config, scriptConfig, true);
    }
    if (!config.main) {
        var questionMark = src.indexOf('?');
        if (questionMark > -1) {
            config.main = decodeURIComponent(src.substring(questionMark + 1));
        }
    }
}
module.exports = config;
