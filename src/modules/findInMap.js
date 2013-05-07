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

var isPlainObject = require('./type.js').isPlainObject;

module.exports = function(map, terms, defaultValue) {
    if (!map) {
        return defaultValue;
    }
    defaultValue = map['**'] || defaultValue;
    for (var i = 0, l = terms.length; i < l; i++) {
        var curTerm = terms[i];
        var value = map[curTerm];
        if (!value) {
            return map['*'] || map['**'] || defaultValue;
        } else if (!isPlainObject(value)) {
            return value;
        }
        defaultValue = map['**'] || defaultValue;
        map = value;
    }
    return map['.'] || map['*'] || map['**'] || defaultValue;
};
