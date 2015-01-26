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

describe("Loader plugins", function() {
    var noder = global.noder || require('../../dist/node/noder.js');
    var directory = global.window ? "/base/spec/browser" : __dirname;
    var expect = global.expect ? global.expect : require("expect.js");

    var fail = function(done) {
        return function(error) {
            done(error || 'Unknown error');
        };
    };

    var testPluginNotUsed = function(fileName) {
        return function(done) {
            var error = fail(done);
            var newRootModule = noder.createContext({
                packaging: {
                    baseUrl: directory + '/loaderPlugin-tests/'
                }
            });

            newRootModule.asyncRequire(fileName).spread(function(pluginUsage1) {
                var cache = newRootModule.require.cache;
                var pluginUsage1Module = cache[fileName];
                var pluginModule = cache["$plugin.js"];
                var notPluginModule = cache["notPlugin.js"];
                expect(pluginUsage1Module.preloaded).to.equal(true);
                expect(pluginUsage1Module.loaded).to.equal(true);
                expect(pluginModule.preloaded).to.equal(true);
                expect(pluginModule.loaded).to.equal(false);
                expect(notPluginModule.preloaded).to.equal(true);
                expect(notPluginModule.loaded).to.equal(false);
                expect(pluginUsage1.testPlugin()).to.equal(false);
                expect(pluginModule.loaded).to.equal(true);
                expect(notPluginModule.loaded).to.equal(false);
                expect(pluginUsage1.testNotPlugin()).to.equal(false);
                expect(notPluginModule.loaded).to.equal(true);
                done();
            }).then(null, error);
        };
    };

    var testPluginUsed = function(fileName, usages) {
        return function(done) {
            var error = fail(done);
            var newRootModule = noder.createContext({
                packaging: {
                    baseUrl: directory + '/loaderPlugin-tests/'
                }
            });

            newRootModule.asyncRequire(fileName).spread(function(pluginUsage2) {
                var cache = newRootModule.require.cache;
                var pluginUsage2Module = cache[fileName];
                var pluginModule = cache["$plugin.js"];
                var notPluginModule = cache["notPlugin.js"];
                expect(pluginModule.exports.preloadCalls).to.length(usages);
                var preloadCalls = pluginModule.exports.preloadCalls;
                for (var i = 0, l = preloadCalls.length; i < l; i++) {
                    expect(preloadCalls[i].resolved).to.equal(true);
                }
                expect(notPluginModule.exports.preloadCalls).to.be.an("undefined");
                expect(pluginUsage2Module.preloaded).to.equal(true);
                expect(pluginUsage2Module.loaded).to.equal(true);
                expect(pluginModule.preloaded).to.equal(true);
                expect(pluginModule.loaded).to.equal(true);
                expect(notPluginModule.preloaded).to.equal(true);
                expect(notPluginModule.loaded).to.equal(false);
                expect(pluginUsage2.testPlugin()).to.equal(true);
                expect(notPluginModule.preloaded).to.equal(true);
                expect(notPluginModule.loaded).to.equal(false);
                expect(pluginUsage2.testNotPlugin()).to.equal(false);
                done();
            }).then(null, error);
        };
    };

    it("Plugin not used 1", testPluginNotUsed("pluginNotUsed1.js"));

    it("Plugin not used 2", testPluginNotUsed("pluginNotUsed2.js"));

    it("Plugin used 1", testPluginUsed("pluginUsed1.js", 1));

    it("Plugin used 2", testPluginUsed("pluginUsed2.js", 1));

    it("Plugin used 3", testPluginUsed("pluginUsed3.js", 2));

});
