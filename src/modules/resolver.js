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

var noderError = require('./noderError.js');
var path = require('./path.js');
var isString = require('./type.js').isString;
var split = path.split;
var emptyObject = {};

var addExtension = function(pathArray) {
    var index = pathArray.length - 1;
    var lastItem = pathArray[index];
    if (lastItem.indexOf('.') == -1) {
        pathArray[index] = lastItem + '.js';
    }
};

var normalize = function(pathArray) {
    for (var i = 0, l = pathArray.length; i < l; i++) {
        var currentPart = pathArray[i];
        if (!currentPart.length || currentPart == '.') {
            pathArray.splice(i, 1);
            i--;
            l--;
        } else if (currentPart == '..' && i > 0 && pathArray[i - 1] != '..') {
            pathArray.splice(i - 1, 2);
            i -= 2;
            l -= 2;
        }
    }
    return pathArray;
};

var applyChange = function(terms, item, index) {
    var itemParts = split(item);
    if (!itemParts[0].length) {
        // item starts with /, replaces the whole terms
        itemParts.shift();
        itemParts.unshift(0, index + 1);
    } else {
        // item is relative
        itemParts.unshift(index, 1);
    }
    terms.splice.apply(terms, itemParts);
};

/**
 * Apply a module map iteration.
 * @param {Object} map
 * @param {Array} terms Note that this array is changed by this function.
 * @return {Boolean}
 */
var applyModuleMap = function(map, terms) {
    for (var i = 0, l = terms.length; i < l; i++) {
        var curTerm = terms[i];
        map = map[curTerm];
        if (!map || curTerm === map) {
            return false; // no change
        } else if (isString(map)) {
            applyChange(terms, map, i);
            return true;
        }
    }
    // if we reach this place, it is a directory
    applyChange(terms, map['.'] || "index.js", terms.length);
    return true;
};

var multipleApplyModuleMap = function(map, terms) {
    var allValues = {};
    // curValue can never be equal to ".", as it is always assigned after normalizing
    var lastValue = ".";
    normalize(terms);
    var curValue = terms.join('/');
    while (curValue !== lastValue) {
        if (terms[0] == '..') {
            throw noderError('resolverRoot', [terms]);
        }
        if (allValues[curValue]) {
            throw noderError('resolverLoop', [terms]);
        } else {
            allValues[curValue] = lastValue;
        }
        if (applyModuleMap(map, terms)) {
            normalize(terms);
        }
        lastValue = curValue;
        curValue = terms.join('/');
    }
};

var Resolver = function(context) {
    this.config = context.config.resolver || emptyObject;
    this.cache = {};
};
var resolverProto = Resolver.prototype = {};

resolverProto.moduleResolve = function(callerModule, calledModule) {
    // Compute the configuration to apply to the caller module:
    var callerModuleSplit = split(callerModule.filename);
    var moduleMap = this.config['default'] || emptyObject;
    var res = split(calledModule);
    var firstPart = res[0];
    if (firstPart === '.' || firstPart === '..') {
        callerModuleSplit.pop(); // keep only the directory
        res = callerModuleSplit.concat(res);
    }

    multipleApplyModuleMap(moduleMap, res);
    addExtension(res);
    return res.join('/');
};

module.exports = Resolver;
