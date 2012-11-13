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

describe("Main", function () {
    var fail = function (done) {
        return function (error) {
            done(error || 'Unknown error');
        };
    };

    var rootModule = require('../dist/node/noder.js');

    it("Simple", function (done) {
        var newRootModule = rootModule.createContext({
            packaging: {
                baseUrl: __dirname + '/main-tests/simple/'
            }
        });
        newRootModule.asyncRequire(['file1']).then(function () {
            var file1 = newRootModule.asyncRequire('file1');
            expect(file1.test1()).toEqual('simple-ok1');
            expect(file1.test2()).toEqual('simple-ok2');
            expect(file1.test3()).toEqual('simple-ok3');
        }).then(done, fail(done));
    });

    it("Circular dependency", function (done) {
        var newRootModule = rootModule.createContext({
            packaging: {
                baseUrl: __dirname + '/main-tests/circularDependency/'
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