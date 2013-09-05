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

var atpackager = require("../atpackager").atpackager();
var grunt = atpackager.grunt;
var UglifyJS = atpackager.uglify;
var path = require("path");
var findRequires = require("./findRequires");
var replaceConstants = require("./replaceConstants");
var uglifyHelpers = atpackager.uglifyHelpers;
var replaceNode = uglifyHelpers.replaceNode;
var wrapCode = uglifyHelpers.wrapCode;


var isModuleVariable = function(moduleCandidate) {
    return moduleCandidate instanceof UglifyJS.AST_SymbolRef && moduleCandidate.name === "module" && moduleCandidate.thedef.undeclared;
};

var getModuleName = function(modulePath) {
    return path.basename(modulePath, '.js');
};

var readFileStripBanner = function(path) {
    var content = grunt.file.read(path);
    content = content.replace(/^\s*\/\*[\s\S]*?\*\/\s*/, '');
    return content;
};

var isModuleRef = function(node) {
    return node && node["extra:isModuleRef"];
};

var ModuleSystem = function() {
    this.modulesByModuleName = {};
    this.modulesByFileName = {};
    this.includedModules = [];
    this.varNames = {};
};

ModuleSystem.prototype.addModule = function(fileName) {
    var module = new Module(this, fileName);
    this.modulesByFileName[fileName] = module;
    module.parentModule = this.modulesByModuleName[module.moduleName];
    this.modulesByModuleName[module.moduleName] = module;
    return module;
};

ModuleSystem.prototype.includeModule = function(module) {
    this.includedModules.push(module);
};

ModuleSystem.prototype.resolveDependencies = function() {
    var includedModulesArray = [];
    var includedModulesMap = {};
    var circularDetection = {};
    var includeModule = function(module) {
        if (includedModulesMap.hasOwnProperty(module.fileName)) {
            // already included
            return;
        }
        if (circularDetection[module.fileName]) {
            return;
        }
        circularDetection[module.fileName] = true;
        try {
            var dependencies = module.getDependencies();
            dependencies.forEach(includeModule);
            includedModulesMap[module.fileName] = true;
            includedModulesArray.push(module);
        } finally {
            circularDetection[module.fileName] = false;
        }
    };
    this.includedModules.forEach(includeModule);
    this.includedModules = includedModulesArray;
};

ModuleSystem.prototype.build = function() {
    var varDefinitions = [];
    var body = [];
    var log = grunt.log;
    this.includedModules.forEach(function(curModule) {
        log.writeln("Using noder module " + curModule.fileName);
        varDefinitions.push(new UglifyJS.AST_VarDef({
            name: new UglifyJS.AST_SymbolVar({
                name: curModule.getVarName()
            })
        }));
        curModule.replaceRequires();
        var topLevel = curModule.getAST();
        replaceConstants(topLevel, isModuleRef);
        topLevel.figure_out_scope();
        // only wrap the module if some variables are declared in the scope:
        if (topLevel.variables.size() > 0) {
            body.push(wrapCode("(function(){$CONTENT$;})();", topLevel.body));
        } else {
            body = body.concat(topLevel.body);
        }
    });
    body.unshift(new UglifyJS.AST_Var({
        definitions: varDefinitions
    }));
    return new UglifyJS.AST_Toplevel({
        body: body
    });
};

var Module = function(moduleSystem, fileName) {
    this.moduleSystem = moduleSystem;
    this.fileName = fileName;
    this.moduleName = getModuleName(fileName);
    this.varName = null;
    this.ast = null;
    this.dependencies = null;
    this.requires = null;
};

Module.prototype.getVarName = function() {
    if (!this.varName) {
        var prefixName = this.moduleName.replace(/[^a-zA-Z]/g, "") + "$module";
        var number = 1;
        var curName = prefixName;
        var existingNames = this.moduleSystem.varNames;
        while (existingNames.hasOwnProperty(curName)) {
            number++;
            curName = prefixName + number;
        }
        existingNames[curName] = true;
        this.varName = curName;
    }
    return this.varName;
};

Module.prototype.createVarRef = function() {
    var res = new UglifyJS.AST_SymbolRef({
        name: this.getVarName()
    });
    res["extra:isModuleRef"] = true;
    return res;
};

Module.prototype.replaceRequires = function() {
    var self = this;
    this.requires.forEach(function(curRequire) {
        replaceNode(curRequire.requireNode, curRequire.parentNode, curRequire.module.createVarRef());
    });
    this.ast = this.ast.transform(new UglifyJS.TreeTransformer(function(node) {
        if (node instanceof UglifyJS.AST_Dot && node.property == "exports") {
            var moduleCandidate = node.expression;
            if (isModuleVariable(moduleCandidate)) {
                return self.createVarRef();
            }
        } else if (isModuleVariable(node)) {
            throw new Error("This limited module system only supports module.exports and no other use of the module variable.");
        }
    }));
};

Module.prototype.getAST = function() {
    if (!this.ast) {
        this.ast = UglifyJS.parse(readFileStripBanner(this.fileName), {
            filename: this.fileName
        });
        this.ast.figure_out_scope();
    }
    return this.ast;
};

Module.prototype.getDependencies = function() {
    if (!this.dependencies) {
        var self = this;
        var ast = self.getAST();
        var requires = findRequires(ast);
        var dependenciesArray = [];
        var dependenciesMap = {};
        var registerDependency = function(moduleName) {
            if (!dependenciesMap.hasOwnProperty(moduleName)) {
                var res = null;
                if (moduleName === self.moduleName) {
                    res = self.parentModule;
                } else {
                    res = self.moduleSystem.modulesByModuleName[moduleName];
                }
                if (!res) {
                    throw new Error("Missing module '" + moduleName + "' required from " + self.fileName);
                }
                dependenciesMap[moduleName] = res;
                dependenciesArray.push(res);
            }
            return dependenciesMap[moduleName];
        };
        this.requires = requires.filter(function(curRequire) {
            var dependency = curRequire.dependency;
            var toBeIncluded = /^(noder-js|.|..)\//.test(dependency);
            if (toBeIncluded) {
                var moduleName = getModuleName(dependency);
                curRequire.module = registerDependency(moduleName);
            }
            return toBeIncluded;
        });
        this.dependencies = dependenciesArray;
    }
    return this.dependencies;
};

module.exports = ModuleSystem;
