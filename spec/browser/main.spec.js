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

var global = (function() {
    return this;
})();

describe("Main", function() {
    var noder = global.noder || require('../../dist/node/noder.js');
    var directory = global.window ? "/base/spec/browser" : __dirname;
    var expect = global.expect ? global.expect : require("expect.js");

    var fail = function(done) {
        return function(error) {
            done(error || 'Unknown error');
        };
    };

    it("Simple asynchronous", function(done) {
        var newRootModule = noder.createContext({
            packaging: {
                baseUrl: directory + '/main-tests/simple/'
            }
        });
        newRootModule.asyncRequire('file1').spread(function(file1) {
            expect(file1.test1()).to.equal('simple-ok1');
            expect(file1.test2()).to.equal('simple-ok2');
            expect(file1.test3()).to.equal('simple-ok3');

            expect(file1).to.equal(newRootModule.require('file1'));
        }).then(done, fail(done));
    });

    it("Simple synchronous", function() {
        var newRootModule = noder.createContext({
            packaging: {
                requestConfig: {
                    sync: true
                },
                baseUrl: directory + '/main-tests/simple/'
            }
        });

        var file1 = newRootModule.require('file1');
        expect(file1.test1()).to.equal('simple-ok1');
        expect(file1.test2()).to.equal('simple-ok2');
        expect(file1.test3()).to.equal('simple-ok3');

    });

    it("Circular dependency asynchronous", function(done) {
        var newRootModule = noder.createContext({
            packaging: {
                baseUrl: directory + '/main-tests/circularDependency/'
            }
        });
        newRootModule.asyncRequire('file1', 'file2').spread(function(file1, file2) {
            expect(file1.test1()).to.equal('ok1');
            expect(file1.test2()).to.equal('ok2');

            expect(file2.test1()).to.equal('ok1');
            expect(file2.test2()).to.equal('ok2');

            expect(file1).to.equal(newRootModule.require('file1'));
            expect(file2).to.equal(newRootModule.require('file2'));
        }).then(done, fail(done));
    });

    it("Circular dependency synchronous", function() {
        var newRootModule = noder.createContext({
            packaging: {
                requestConfig: {
                    sync: true
                },
                baseUrl: directory + '/main-tests/circularDependency/'
            }
        });

        var file1 = newRootModule.require('file1');
        expect(file1.test1()).to.equal('ok1');
        expect(file1.test2()).to.equal('ok2');

        var file2 = newRootModule.require('file2');
        expect(file2.test1()).to.equal('ok1');
        expect(file2.test2()).to.equal('ok2');
    });

    var itChecksError = function(fileName, checkError) {
        it("Checks error in " + fileName + " synchronously", function() {
            var newRootModule = noder.createContext({
                packaging: {
                    requestConfig: {
                        sync: true
                    },
                    baseUrl: directory + '/main-tests/error/'
                }
            });

            var error = false;
            try {
                newRootModule.require(fileName);
            } catch (e) {
                error = true;
                checkError(e);
            }
            expect(error).to.equal(true);
        });
        it("Checks error in " + fileName + " asynchronously", function(done) {
            var newRootModule = noder.createContext({
                packaging: {
                    requestConfig: {
                        sync: true
                    },
                    baseUrl: directory + '/main-tests/error/'
                }
            });

            newRootModule.asyncRequire(fileName).then(function() {
                expect().fail("No error while loading " + fileName);
            }, checkError).then(done, fail(done));
        });
    };

    itChecksError("syntax.error.js", function(error) {
        if (error.logDetails) {
            error.logDetails();
        }
        var errorMsg = error.message || error.description;
        expect(errorMsg).to.contain("Unexpected token in");
        expect(errorMsg).to.contain("syntax.error.js");
        expect(errorMsg).to.contain("line 2,");
        expect(errorMsg).to.contain("something: wrong)");
    });

    itChecksError("syntax-end.error.js", function(error) {
        if (error.logDetails) {
            error.logDetails();
        }
        var errorMsg = error.message || error.description;
        expect(errorMsg).to.contain("Unexpected token in");
        expect(errorMsg).to.contain("syntax-end.error.js");
        expect(errorMsg).to.contain("line 7,");
    });
});
