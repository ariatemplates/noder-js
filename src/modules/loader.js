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
var scriptBaseUrl = require('../node-modules/scriptBaseUrl');
var filters = require('./filters');
var bind1 = require('./bind1');
var merge = require('./merge');

var xhrContent = function(xhr) {
    return xhr.responseText;
};

var Loader = function(context) {
    var config = context.config.packaging || emptyObject;
    this.config = config;
    this.baseUrl = (config.baseUrl || "").replace(/^%scriptdir%\//, scriptBaseUrl());
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
        return this.loadUnpackaged(module);
    }
};

loaderProto.loadUnpackaged = function(module) {
    module.url = this.baseUrl + module.filename;
    return request(module.url, this.config.requestConfig).thenSync(xhrContent).thenSync(bind1(this.preprocessUnpackaged, this, module));
};

loaderProto.preprocessUnpackaged = function(module, code) {
    var preprocessors = this.config.preprocessors;
    if (!preprocessors || !preprocessors.length) {
        return this.defineUnpackaged(module, code);
    } else {
        return filters(this.context, preprocessors, module.filename, [code, module.filename]).thenSync(bind1(this.defineUnpackaged, this, module));
    }
};

loaderProto.defineUnpackaged = function(module, code) {
    this.context.jsModuleDefine(code, module.filename, module.url);
};

loaderProto.loadPackaged = function(packageName) {
    var self = this;
    var url = self.baseUrl + packageName;
    var res = self.currentLoads[url];
    if (!res) {
        self.currentLoads[url] = res = request(url, self.config.requestConfig).thenSync(xhrContent).thenSync(function(content) {
            var body = self.jsPackageEval(content, url);
            body(self.context.define);
        })["finally"](function() {
            delete self.currentLoads[url];
            self = null;
        });
    }
    return res;
};

loaderProto.jsPackageEval = function(jsCode, url) {
    return jsEval(jsCode, url, "(function(define){\n", "\n})");
};

loaderProto.updatePackagesMap = function(newMap) {
    var config = this.config;
    if (config.packagesMap) {
        merge(config.packagesMap, newMap, true);
    } else {
        config.packagesMap = newMap;
    }
};

module.exports = Loader;
