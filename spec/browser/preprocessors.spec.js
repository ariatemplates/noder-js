/*
 * Copyright 2013 Amadeus s.a.s.
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

describe("Preprocessors", function() {
    var noder = global.noder || require('../../dist/node/noder.js');
    var directory = global.window ? "/base/spec/browser" : __dirname;
    var expect = global.expect ? global.expect : require("expect.js");

    var fail = function(done) {
        return function(error) {
            done(error || 'Unknown error');
        };
    };

    var createTest = function(preprocessors, expectedResult, sync) {
        return function(done) {
            var error = fail(done);
            var newRootModule = noder.createContext({
                packaging: {
                    requestConfig: {
                        sync: sync
                    },
                    baseUrl: directory + '/preprocessors-tests/',
                    preprocessors: preprocessors
                }
            });
            var isSync = true;

            newRootModule.asyncRequire("originalFile").spreadSync(function(result) {
                expect(result).to.eql(expectedResult);
                expect(isSync).to.equal(sync);
                if (sync) {
                    return done;
                }
            }).thenSync(sync ? createTest(preprocessors, expectedResult, false) : done, error);
            isSync = false;
        };
    };

    it("No preprocessor", createTest(null, {
        fileName1: "<PREPROCESSOR1-FILENAME>",
        fileName2: "<PREPROCESSOR2-FILENAME>",
        change1: "<PREPROCESSOR1-CHANGE1>",
        change2: "<PREPROCESSOR2-CHANGE1>",
        change3: "<PREPROCESSOR1-CHANGE2>",
        change4: "<PREPROCESSOR2-CHANGE2>"
    }, true));

    it("Preprocessor 1 only", createTest([{
        pattern: /originalFile/,
        module: "syncPreprocessor1"
    }], {
        fileName1: "originalFile.js",
        fileName2: "<PREPROCESSOR2-FILENAME>",
        change1: "<PREPROCESSOR2-CHANGE2>",
        change2: "<PREPROCESSOR2-CHANGE1>",
        change3: "OK",
        change4: "<PREPROCESSOR2-CHANGE2>"
    }, true));

    it("Preprocessor 2 only", createTest([{
        pattern: /originalFile/,
        module: "syncPreprocessor2"
    }], {
        fileName1: "<PREPROCESSOR1-FILENAME>",
        fileName2: "originalFile.js",
        change1: "<PREPROCESSOR1-CHANGE1>",
        change2: "<PREPROCESSOR1-CHANGE2>",
        change3: "<PREPROCESSOR1-CHANGE2>",
        change4: "OK"
    }, true));

    it("Preprocessor 1+2", createTest([{
        pattern: /originalFile/,
        module: "syncPreprocessor1"
    }, {
        pattern: /originalFile/,
        module: "syncPreprocessor2"
    }], {
        fileName1: "originalFile.js",
        fileName2: "originalFile.js",
        change1: "OK",
        change2: "<PREPROCESSOR1-CHANGE2>",
        change3: "OK",
        change4: "OK"
    }, true));

    it("Preprocessor 2+1", createTest([{
        pattern: /originalFile/,
        module: "syncPreprocessor2"
    }, {
        pattern: /originalFile/,
        module: "syncPreprocessor1"
    }], {
        fileName1: "originalFile.js",
        fileName2: "originalFile.js",
        change1: "<PREPROCESSOR2-CHANGE2>",
        change2: "OK",
        change3: "OK",
        change4: "OK"
    }, true));

    it("Preprocessing preprocessor 1 with preprocessor 2", createTest([{
        pattern: /originalFile/,
        module: "syncPreprocessor1"
    }, {
        pattern: /syncPreprocessor1/,
        module: "syncPreprocessor2"
    }], {
        fileName1: "originalFile.js",
        fileName2: "<PREPROCESSOR2-FILENAME>",
        change1: "OK",
        change2: "<PREPROCESSOR2-CHANGE1>",
        change3: "OK",
        change4: "<PREPROCESSOR2-CHANGE2>"
    }, true));

    it("Preprocessing preprocessor 2 with preprocessor 1", createTest([{
        pattern: /originalFile/,
        module: "syncPreprocessor2"
    }, {
        pattern: /syncPreprocessor2/,
        module: "syncPreprocessor1"
    }], {
        fileName1: "<PREPROCESSOR1-FILENAME>",
        fileName2: "originalFile.js",
        change1: "<PREPROCESSOR1-CHANGE1>",
        change2: "OK",
        change3: "<PREPROCESSOR1-CHANGE2>",
        change4: "OK"
    }, true));

    it("Async preprocessor 1 only", createTest([{
        pattern: /originalFile/,
        module: "asyncPreprocessor1"
    }], {
        fileName1: "originalFile.js",
        fileName2: "<PREPROCESSOR2-FILENAME>",
        change1: "<PREPROCESSOR2-CHANGE2>",
        change2: "<PREPROCESSOR2-CHANGE1>",
        change3: "OK",
        change4: "<PREPROCESSOR2-CHANGE2>"
    }, false));

    it("Preprocessor async 1 + sync 2", createTest([{
        pattern: /originalFile/,
        module: "asyncPreprocessor1"
    }, {
        pattern: /originalFile/,
        module: "syncPreprocessor2"
    }], {
        fileName1: "originalFile.js",
        fileName2: "originalFile.js",
        change1: "OK",
        change2: "<PREPROCESSOR1-CHANGE2>",
        change3: "OK",
        change4: "OK"
    }, false));

    it("Preprocessor sync 2 + async 1", createTest([{
        pattern: /originalFile/,
        module: "syncPreprocessor2"
    }, {
        pattern: /originalFile/,
        module: "asyncPreprocessor1"
    }], {
        fileName1: "originalFile.js",
        fileName2: "originalFile.js",
        change1: "<PREPROCESSOR2-CHANGE2>",
        change2: "OK",
        change3: "OK",
        change4: "OK"
    }, false));

    it("Preprocessor async 2 + async 1", createTest([{
        pattern: /originalFile/,
        module: "asyncPreprocessor2"
    }, {
        pattern: /originalFile/,
        module: "asyncPreprocessor1"
    }], {
        fileName1: "originalFile.js",
        fileName2: "originalFile.js",
        change1: "<PREPROCESSOR2-CHANGE2>",
        change2: "OK",
        change3: "OK",
        change4: "OK"
    }, false));

    it("Preprocessor with arguments", createTest([{
        pattern: /originalFile/,
        module: "stringReplacements",
        options: {
            replacements: [{
                find: /<PREPROCESSOR1/g,
                replace: "<PREPROCESSOR2"
            }, {
                find: /-CHANGE1>/g,
                replace: "-CHANGE2>"
            }]
        }
    }, {
        pattern: /originalFile/,
        module: "asyncPreprocessor2"
    }], {
        fileName1: "originalFile.js",
        fileName2: "originalFile.js",
        change1: "OK",
        change2: "OK",
        change3: "OK",
        change4: "OK"
    }, false));

});
