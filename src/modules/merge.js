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

var undef;

var type = require('./type.js');
var isPlainObject = type.isPlainObject;

var extractProperty = function (array, property, startIndex, endIndex) {
    var res = [];
    var index = 0;
    for (var i = startIndex; i < endIndex; i++) {
        var object = array[i];
        if (isPlainObject(object)) {
            var value = object[property];
            if (value != undef) {
                res[index] = value;
                if (index === 0 && !isPlainObject(value)) {
                    // it is not needed to build the whole array
                    // in case the first item is not a plain object
                    break;
                }
                index++;
            }
        }
    }
    return res;
};

var merge = function (objects) {
    var l = objects.length;
    if (l === 0) {
        return undef;
    } else if (l == 1) {
        return objects[0];
    }
    var res;
    for (var i = 0; i < l; i++) {
        var curObject = objects[i];
        if (curObject != undef) {
            if (isPlainObject(curObject)) {
                if (!res) {
                    res = {};
                }
                for (var key in curObject) {
                    if (curObject.hasOwnProperty(key) && !res.hasOwnProperty(key)) {
                        res[key] = merge(extractProperty(objects, key, i, l));
                    }
                }
            } else if (!res) {
                return curObject;
            }
        }
    }
    return res;
};

module.exports = merge;