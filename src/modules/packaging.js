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

var loadFile = require('../node-modules/loadFile.js');
var extractDependencies = require('./extractDependencies.js');
var moduleFunction = require('./moduleFunction.js');
var packageFunction = require('./packageFunction.js');
var findInMap = require('./findInMap.js');
var split = require('./path.js').split;
var emptyObject = {};

var Packaging = function(config, define) {
    config = config || emptyObject;
    this.config = config;
    this.define = define;
    this.currentLoads = {};
    var bootstrap = config.bootstrap;
    if (bootstrap) {
        bootstrap(define);
    }
};

var packagingProto = Packaging.prototype = {};

packagingProto.loadModule = function(moduleName) {
    var packageName;
    var packagesMap = this.config.packagesMap;
    if (packagesMap) {
        var splitModuleName = split(moduleName);
        packageName = findInMap(packagesMap || emptyObject, splitModuleName, null);
    }
    if (packageName) {
        return this.loadPackaged(packageName);
    } else {
        return this.loadUnpackaged(moduleName);
    }
};

packagingProto.loadUnpackaged = function(moduleName) {
    var url = (this.config.baseUrl || "") + moduleName;
    var define = this.define;
    return loadFile(url).then(function(jsCode) {
        var dependencies = extractDependencies(jsCode);
        var body = moduleFunction(jsCode, url);
        define(moduleName, dependencies, body);
    }).always(function() {
        define = null;
    });
};

packagingProto.loadPackaged = function(packageName) {
    var self = this;
    var url = (self.config.baseUrl || "") + packageName;
    var res = self.currentLoads[url];
    if (!res) {
        self.currentLoads[url] = res = loadFile(url).then(function(jsCode) {
            var body = packageFunction(jsCode, url);
            body(self.define);
        }).always(function() {
            delete self.currentLoads[url];
            self = null;
        });
    }
    return res;
};
module.exports = Packaging;
