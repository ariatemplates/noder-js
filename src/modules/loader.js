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

var request = require('../node-modules/request.js');
var jsEval = require('./jsEval.js');
var findInMap = require('./findInMap.js');
var split = require('./path.js').split;
var emptyObject = {};

var Loader = function(context) {
    var config = context.config.packaging || emptyObject;
    this.config = config;
    this.baseUrl = config.baseUrl || "";
    this.context = context;
    this.currentLoads = {};
    var bootstrap = config.bootstrap;
    if (bootstrap) {
        bootstrap(context.define);
    }
};

var loaderProto = Loader.prototype = {};

loaderProto.moduleLoad = function(module) {
    var moduleName = module.filename;
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

loaderProto.loadUnpackaged = function(moduleName) {
    var url = this.baseUrl + moduleName;
    var context = this.context;
    return request(url, this.config.requestConfig).thenSync(function(jsCode) {
        context.jsModuleDefine(jsCode, moduleName, url);
    }).always(function() {
        context = null;
    });
};

loaderProto.loadPackaged = function(packageName) {
    var self = this;
    var url = self.baseUrl + packageName;
    var res = self.currentLoads[url];
    if (!res) {
        self.currentLoads[url] = res = request(url, self.config.requestConfig).thenSync(function(jsCode) {
            var body = self.jsPackageEval(jsCode, url);
            body(self.context.define);
        }).always(function() {
            delete self.currentLoads[url];
            self = null;
        });
    }
    return res;
};

loaderProto.jsPackageEval = function(jsCode, url) {
    var code = ['(function(define){\n', jsCode, '\n})'];
    return jsEval(code.join(''), url, 1 /* we are adding 1 line compared to url */ );
};

module.exports = Loader;
