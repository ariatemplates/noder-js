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

define("file1.js", ["./lib/file2.js"], function(module) {
    var require = module.require;
    var file2 = require('./lib/file2.js');
    module.exports = {
        test1: function() {
            return "simple-ok1";
        },
        test2: file2.test2,
        test3: file2.test3
    };

});

define("lib/file2.js", ["./file3.js"], function(module) {
    var require = module.require;
    module.exports = {
        test2: function() {
            return "simple-ok2";
        },
        test3: require('./file3.js')
    };

});

define("lib/file3.js", [], function(module) {
    module.exports = function() {
        return "simple-ok3";
    };

});
