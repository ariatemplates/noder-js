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

var Promise = require('./promise');
var typeUtils = require('./src/modules/type');

var create = function(module) {
    var res = function() {
        var args = arguments;
        return new Promise(function(fulfill) {
            var result = [];
            for (var i = 0, l = args.length; i < l; i++) {
                var item = args[i];
                if (typeUtils.isString(item)) {
                    result[i] = module.require(item);
                }
            }
            fulfill(result);
        });
    };
    res.create = create;
    return res;
};


module.exports = create(module);
