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

var toString = Object.prototype.toString;
var isString = function(str) {
    return (typeof str === "string") || toString.call(str) === '[object String]';
};
var isArray = Array.isArray || function(obj) {
        return toString.call(obj) === '[object Array]';
    };

var isFunction = function(fn) {
    return (typeof fn == "function");
};

var isObject = function(obj) {
    return obj && (typeof obj == "object");
};

var isPlainObject = function(obj) {
    return obj ? toString.call(obj) === '[object Object]' : false;
};

module.exports = {
    isFunction: isFunction,
    isArray: isArray,
    isString: isString,
    isObject: isObject,
    isPlainObject: isPlainObject
};
