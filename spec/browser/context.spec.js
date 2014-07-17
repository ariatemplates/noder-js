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

describe("Context", function() {
    var noder = global.noder || require('../../dist/node/noder.js');
    var directory = global.window ? "/base/spec/browser" : __dirname;
    var expect = global.expect ? global.expect : require("expect.js");

    var fail = function(done) {
        return function(error) {
            done(error || 'Unknown error');
        };
    };

    it("updatePackagesMap new", function(done) {
        var newRootModule = noder.createContext({
            packaging: {
                baseUrl: directory + '/context-tests/'
            }
        });

        newRootModule.updatePackagesMap({
            paintings: {
                "*": "packaged-modules-one.js"
            }
        });
        newRootModule.asyncRequire('paintings/catalogue').spread(function(catalogue) {
            expect(catalogue()).to.equal('testString');
        }).then(done, fail(done));
    });

    it("updatePackagesMap merge", function(done) {
        var newRootModule = noder.createContext({
            packaging: {
                baseUrl: directory + '/context-tests/',
                packagesMap: {
                    paintings: {
                        "catalogue.js": "packaged-modules-three.js",
                        "painting.js": "packaged-modules-three.js"
                    }
                }
            }
        });

        newRootModule.updatePackagesMap({
            sculptures: {
                "*": "packaged-modules-two.js"
            },
            paintings: {
                "image.js": "packaged-modules-two.js"
            }
        });
        newRootModule.asyncRequire('paintings/catalogue', 'sculptures/catalogue').spread(function(catalogueOne, catalogueTwo) {
            expect(catalogueOne()).to.equal('testString');
            expect(catalogueTwo()).to.equal('anotherTestString');
        }).then(done, fail(done));
    });

});
