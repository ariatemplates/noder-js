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
var typeUtils = require("./type");

var merge = function(dst, src, rec) {
    for (var key in src) {
        if (src.hasOwnProperty(key)) {
            var srcValue = src[key];
            var dstValue;
            if (rec && typeUtils.isPlainObject(srcValue) && typeUtils.isPlainObject(dstValue = dst[key])) {
                merge(dstValue, srcValue, rec);
            } else {
                dst[key] = srcValue;
            }
        }
    }
};

module.exports = merge;
