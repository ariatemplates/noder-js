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

var defer = require('./promise').defer;
var typeUtils = require('./src/modules/type');

module.exports = {
    create: function(module) {
        return function() {
            var deferred = defer();
            var result = [];
            try {
                for (var i = 0, l = arguments.length; i < l; i++) {
                    var item = arguments[i];
                    if (typeUtils.isString(item)) {
                        result[i] = module.require(item);
                    }
                }
                deferred.resolve.apply(deferred, result);
            } catch (e) {
                deferred.reject(e);
            }
            return deferred.promise;
        };
    }
};
