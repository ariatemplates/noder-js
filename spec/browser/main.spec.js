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

    var simpleAsynchronousCheck = function(newRootModule, done) {
        var cache = newRootModule.require.cache;
        var file1Preloaded = false;
        newRootModule.asyncRequire('file1').spread(function(file1) {
            expect(file1.test1()).to.equal('simple-ok1');
            expect(file1.test2()).to.equal('simple-ok2');
            expect(file1.test3()).to.equal('simple-ok3');
            expect(file1).to.equal(newRootModule.require('file1'));
            expect(file1Preloaded).to.be(true);
        }).then(done, fail(done));
        cache['file1.js'].noderInfo.preloading.thenSync(function() {
            expect(cache['file1.js'].noderInfo.preloading.isFulfilled()).to.be(true);
            expect(cache['file1.js'].noderInfo.dependencies).to.eql(['./lib/file2.js']);
            expect(cache['lib/file2.js'].noderInfo.preloading.isFulfilled()).to.be(true);
            expect(cache['lib/file2.js'].noderInfo.dependencies).to.eql(['./file3.js']);
            expect(cache['lib/file3.js'].noderInfo.preloading.isFulfilled()).to.be(true);
            expect(cache['lib/file3.js'].noderInfo.dependencies).to.eql([]);
            file1Preloaded = true;
        });
    };

    it("Simple asynchronous", function(done) {
        simpleAsynchronousCheck(noder.createContext({
            packaging: {
                baseUrl: directory + '/main-tests/simple/'
            }
        }), done);
    });


    it("Simple asynchronous packaged", function(done) {
        simpleAsynchronousCheck(noder.createContext({
            packaging: {
                baseUrl: directory + '/main-tests/packaged/',
                packagesMap: {
                    "**": "simple.js"
                }
            }
        }), done);
    });

    var simpleSynchronousCheck = function(newRootModule) {
        var file1 = newRootModule.require('file1');
        expect(file1.test1()).to.equal('simple-ok1');
        expect(file1.test2()).to.equal('simple-ok2');
        expect(file1.test3()).to.equal('simple-ok3');

        var cache = newRootModule.require.cache;
        expect(cache['file1.js'].noderInfo.preloading.isFulfilled()).to.be(true);
        expect(cache['file1.js'].noderInfo.dependencies).to.eql(['./lib/file2.js']);
        expect(cache['lib/file2.js'].noderInfo.preloading.isFulfilled()).to.be(true);
        expect(cache['lib/file2.js'].noderInfo.dependencies).to.eql(['./file3.js']);
        expect(cache['lib/file3.js'].noderInfo.preloading.isFulfilled()).to.be(true);
        expect(cache['lib/file3.js'].noderInfo.dependencies).to.eql([]);
    };

    it("Simple synchronous", function() {
        simpleSynchronousCheck(noder.createContext({
            packaging: {
                requestConfig: {
                    sync: true
                },
                baseUrl: directory + '/main-tests/simple/'
            }
        }));
    });

    it("Simple synchronous packaged", function() {
        simpleSynchronousCheck(noder.createContext({
            packaging: {
                requestConfig: {
                    sync: true
                },
                baseUrl: directory + '/main-tests/packaged/',
                packagesMap: {
                    "**": "simple.js"
                }
            }
        }));
    });

    var circularAsynchronousCheck = function(newRootModule, done) {
        newRootModule.asyncRequire('file1', 'file2').spread(function(file1, file2) {
            expect(file1.test1()).to.equal('ok1');
            expect(file1.test2()).to.equal('ok2');

            expect(file2.test1()).to.equal('ok1');
            expect(file2.test2()).to.equal('ok2');

            expect(file1).to.equal(newRootModule.require('file1'));
            expect(file2).to.equal(newRootModule.require('file2'));

            var cache = newRootModule.require.cache;
            expect(cache['file1.js'].noderInfo.preloading.isFulfilled()).to.be(true);
            expect(cache['file1.js'].noderInfo.dependencies).to.eql(['./file2.js']);
            expect(cache['file2.js'].noderInfo.preloading.isFulfilled()).to.be(true);
            expect(cache['file2.js'].noderInfo.dependencies).to.eql(['./file1.js']);
        }).then(done, fail(done));
    };

    it("Circular dependency asynchronous", function(done) {
        circularAsynchronousCheck(noder.createContext({
            packaging: {
                baseUrl: directory + '/main-tests/circularDependency/'
            }
        }), done);
    });

    it("Circular dependency asynchronous packaged", function(done) {
        circularAsynchronousCheck(noder.createContext({
            packaging: {
                baseUrl: directory + '/main-tests/packaged/',
                packagesMap: {
                    "**": "circular.js"
                }
            }
        }), done);
    });

    var circularSynchronousCheck = function(newRootModule) {
        var file1 = newRootModule.require('file1');
        expect(file1.test1()).to.equal('ok1');
        expect(file1.test2()).to.equal('ok2');

        var file2 = newRootModule.require('file2');
        expect(file2.test1()).to.equal('ok1');
        expect(file2.test2()).to.equal('ok2');

        var cache = newRootModule.require.cache;
        expect(cache['file1.js'].noderInfo.preloading.isFulfilled()).to.be(true);
        expect(cache['file1.js'].noderInfo.dependencies).to.eql(['./file2.js']);
        expect(cache['file2.js'].noderInfo.preloading.isFulfilled()).to.be(true);
        expect(cache['file2.js'].noderInfo.dependencies).to.eql(['./file1.js']);
    };

    it("Circular dependency synchronous", function() {
        circularSynchronousCheck(noder.createContext({
            packaging: {
                requestConfig: {
                    sync: true
                },
                baseUrl: directory + '/main-tests/circularDependency/'
            }
        }));
    });

    it("Circular dependency synchronous packaged", function() {
        circularSynchronousCheck(noder.createContext({
            packaging: {
                requestConfig: {
                    sync: true
                },
                baseUrl: directory + '/main-tests/packaged/',
                packagesMap: {
                    "**": "circular.js"
                }
            }
        }));
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

    itChecksError("pluginException.js", function(error) {
        if (error.logDetails) {
            error.logDetails();
        }
        var errorMsg = error.message || error.description;
        expect(errorMsg).to.contain("this error from the plugin has to be reported!!!");
        expect(errorMsg).to.contain("failed to process plugin require(\'./$pluginException\').plugin for module \'pluginException.js\'");
    });
});
