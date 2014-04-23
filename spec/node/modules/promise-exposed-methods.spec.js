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

describe('Promises/Exposed methods', function() {
    var expect = require("expect.js");
    var promise = require("../../../promise.js");

    it("resolve/reject", function() {
        var instance = promise.defer();
        var res = instance.promise;
        expect(instance.resolve).to.be.a("function");
        expect(instance.reject).to.be.a("function");
        expect(res.resolve).to.be.an("undefined");
        expect(res.reject).to.be.an("undefined");
    });

});
