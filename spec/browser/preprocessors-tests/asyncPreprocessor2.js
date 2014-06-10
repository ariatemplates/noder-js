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
var Promise = require("noder-js/promise");

module.exports = function(code, fileName) {
    var defer = Promise.defer();
    setTimeout(function() {
        var res = code.replace(/<PREPROCESSOR2-FILENAME>/g, fileName);
        res = res.replace(/<PREPROCESSOR2-CHANGE1>/g, "<PREPROCESSOR1-CHANGE2>");
        res = res.replace(/<PREPROCESSOR2-CHANGE2>/g, "OK");
        defer.resolve(res);
    }, 5);
    return defer.promise;
};
