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
    var expect = require("expect.js");
    var Promise = require("../../../promise.js");

    var myValue = {};
    var myFunction = function() {
        return myValue;
    };

    var checkResult = function(promiseValue, done) {
        promiseValue.spread(function(value) {
            expect(value).to.equal(myValue);
            done();
        }, function() {
            done(new Error("The promise raised an unexpected error."));
        });
    };

    it("Direct value (all)", function(done) {
        checkResult(Promise.all([myFunction()]), done);
    });

    it("Chaining promises (all)", function(done) {
        checkResult(Promise.all([Promise.done.then(myFunction)]), done);
    });

    it("Fail fast (all)", function(done) {
        var unresolvedDefer = Promise.defer();
        var errorDefer = Promise.defer();
        var myError = {};
        errorDefer.reject(myError);
        Promise.all([unresolvedDefer.promise, errorDefer.promise]).then(function() {
            done(new Error("The success callback should not be called."));
        }, function(raisedError) {
            expect(raisedError).to.equal(myError);
            done();
        }).done();
    });


    it("Direct value (allSettled)", function(done) {
        checkResult(Promise.allSettled([myFunction()]), done);
    });

    it("Chaining promises (allSettled)", function(done) {
        checkResult(Promise.allSettled([Promise.done.then(myFunction)]), done);
    });

    it("Fail slow (allSettled)", function(done) {
        var later = false;
        var resolveLaterDefer = Promise.defer();
        var errorDefer = Promise.defer();
        var myError = {};
        errorDefer.reject(myError);
        Promise.allSettled([resolveLaterDefer.promise, errorDefer.promise]).then(function() {
            done(new Error("The success callback should not be called."));
        }, function(raisedError) {
            expect(later).to.equal(true);
            expect(raisedError).to.equal(myError);
            done();
        }).done();
        setTimeout(function() {
            later = true;
            resolveLaterDefer.resolve();
        }, 200);
    });

});
