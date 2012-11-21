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

var global = (function () {
    return this;
})();

describe("Main", function () {
    var noder = global.noder || require('../../dist/node/noder.js');
    var directory = global.window ? "/noder/spec/browser" : __dirname;

    // For this test to run both in a browser and in node.js:
    var asyncIt = function (name, fn) {
        it(name, function () {
            var finished = false;
            fn(function (error) {
                expect(error).toBeFalsy();
                finished = true;
            });
            waitsFor(function () {
                return finished;
            });
        });
    };
    var fail = function (done) {
        return function (error) {
            done(error || 'Unknown error');
        };
    };

    asyncIt("Simple", function (done) {
        var newRootModule = noder.createContext({
            packaging: {
                baseUrl: directory + '/main-tests/simple/'
            }
        });
        newRootModule.asyncRequire(['file1']).then(function () {
            var file1 = newRootModule.asyncRequire('file1');
            expect(file1.test1()).toEqual('simple-ok1');
            expect(file1.test2()).toEqual('simple-ok2');
            expect(file1.test3()).toEqual('simple-ok3');
        }).then(done, fail(done));
    });

    asyncIt("Circular dependency", function (done) {
        var newRootModule = noder.createContext({
            packaging: {
                baseUrl: directory + '/main-tests/circularDependency/'
            }
        });
        newRootModule.asyncRequire(['file1']).then(function () {
            var file1 = newRootModule.asyncRequire('file1');
            expect(file1.test1()).toEqual('ok1');
            expect(file1.test2()).toEqual('ok2');

            var file2 = newRootModule.asyncRequire('file2');
            expect(file2.test1()).toEqual('ok1');
            expect(file2.test2()).toEqual('ok2');
        }).then(done, fail(done));
    });
});