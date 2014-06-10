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

var Promise = require("./promise");

module.exports = function(context, filterConfig, filename, args) {
    var items = (filterConfig || []).slice(0);
    var next = function(content) {
        args[0] = content;
        if (!items.length) {
            return Promise.resolve(content);
        }
        var currentFilter = items.shift();
        if (currentFilter.pattern && currentFilter.pattern.test(filename)) {
            return context.moduleAsyncRequire(context.rootModule, [currentFilter.module]).spreadSync(function(processor) {
                return Promise.resolve(processor.apply(null, args.concat(currentFilter.options))).thenSync(next);
            });
        } else {
            return next(args[0]);
        }
    };
    return next(args[0]);
};
