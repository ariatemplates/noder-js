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

describe('Promises/When', function() {
    var expect = require("chai").expect;
    var promise = require("../../../promise.js");

    var myValue = {};
    var myFunction = function() {
        return myValue;
    };

    var checkResult = function(promiseValue, done) {
        promiseValue.then(function(value) {
            expect(value).to.equal(myValue);
            done();
        }, function() {
            done("The promise raised an unexpected error.");
        });
    };

    it("Direct value", function(done) {
        checkResult(promise.when([myFunction()]), done);
    });

    it("Chaining promises", function(done) {
        checkResult(promise.when([promise.done.then(myFunction)]), done);
    });

});
