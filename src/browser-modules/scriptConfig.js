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

var scriptTag = require('./scriptTag.js');
var config = {};
var configContent = scriptTag.innerHTML;
if (!/^\s*$/.test(configContent || "")) {
    var exec = require('./eval.js');
    config = exec(configContent) || config;
}
var src = scriptTag.src;
if (!config.main && src) {
    var questionMark = src.indexOf('?');
    if (questionMark > -1) {
        config.main = decodeURIComponent(src.substring(questionMark + 1));
    }
}

module.exports = config;
