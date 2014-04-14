/*
 * Copyright 2014 Amadeus s.a.s.
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

module.exports = function(code, fileName, options) {
    var replacements = options.replacements;
    var res = code;
    for (var i = 0, l = replacements.length; i < l; i++) {
        var curReplacement = replacements[i];
        res = res.replace(curReplacement.find, curReplacement.replace);
    }
    return res;
};
