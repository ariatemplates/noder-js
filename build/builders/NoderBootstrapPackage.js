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

var path = require('path');
var util = require('util');
var atpackager = require('../atpackager').atpackager();

var configUtils = require('../helpers/configUtils');
var NoderPackage = require('./NoderPackage');
var ModuleSystem = require("../helpers/moduleSystem");
var merge = require("../../src/modules/merge");

var UglifyJS = atpackager.uglify;
var grunt = atpackager.grunt;
var fileUtils = grunt.file;
var log = grunt.log;
var uglifyHelpers = atpackager.uglifyHelpers;
var wrapCode = uglifyHelpers.wrapCode;
var cloneNode = uglifyHelpers.cloneNode;
var getExpression = uglifyHelpers.getExpression;
var setJSONPropertyInAST = uglifyHelpers.setJSONPropertyInAST;
var jsToAST = uglifyHelpers.jsToAST;

var noderSrc = path.join(__dirname, '../../src/');
var noderEnvConfig = {
    "node": {
        wrapper: "/*jshint undef:true, node:true, -W069, -W055*/\nmodule.exports = (function(packagedConfig){\n'use strict';\n$NODER_CONTENT$;\n})(function(){\n$PACKAGED_CONFIG$\n});",
        modules: [path.join(noderSrc, 'modules/**/*.js'), path.join(noderSrc, 'node-modules/**/*.js')],
        defConfig: function() {
            return {};
        }
    },
    "browser": {
        wrapper: "/*jshint undef:true, -W069, -W055*/\n(function(global,callEval,packagedConfig){\n'use strict';\n$NODER_CONTENT$\n})((function(){return this;})(),function(){\n/*jshint evil:true */\neval(arguments[0]);\n},function(){\n$PACKAGED_CONFIG$\n});",
        modules: [path.join(noderSrc, 'modules/**/*.js'), path.join(noderSrc, 'browser-modules/**/*.js')],
        defConfig: function() {
            return {
                mainContext: {
                    varName: "noder",
                    scriptsType: "application/x-noder"
                }
            };
        }
    }
};

var NoderBootstrapPackage = function(cfg) {
    cfg = cfg || {};

    this.noderModules = cfg.noderModules || [];
    this.noderMainModule = cfg.noderMainModule || "main";
    this.noderEnvConfig = noderEnvConfig[cfg.noderEnvironment || "browser"];
    this.noderConfig = cfg.noderConfig;
    this.noderConfigFullOptions = {
        mainContext: cfg.noderConfigOptions || {},
        errorContext: cfg.noderConfigErrorOptions || {}
    };
    if (cfg.noderPackageWrapper) {
        this.noderPackageWrapper = cfg.noderPackageWrapper;
    }
    if (cfg.noderPackageConfigProperty) {
        this.noderPackageConfigProperty = cfg.noderPackageConfigProperty;
    }

    if (!this.noderEnvConfig) {
        throw new Error("Invalid value for noderEnvironment. Expected 'browser' or 'node'.");
    }

    NoderPackage.call(this, cfg); // parent constructor
};

util.inherits(NoderBootstrapPackage, NoderPackage);

NoderBootstrapPackage.prototype.noderPackageWrapper = "(function(define) {\n $CONTENT$\n })";
NoderBootstrapPackage.prototype.noderPackageConfigProperty = "mainContext.packaging.bootstrap";

NoderBootstrapPackage.prototype.createNoderContent = function() {
    var modules = fileUtils.expand({
        filter: "isFile"
    }, this.noderEnvConfig.modules.concat(this.noderModules));
    var moduleSystem = new ModuleSystem();

    for (var i = 0, l = modules.length; i < l; i++) {
        var curModule = moduleSystem.addModule(modules[i]);
        if (curModule.parentModule) {
            log.writeln('Overriding ' + curModule.parentModule.fileName + ' with ' + curModule.fileName);
        }
    }

    var mainModule = moduleSystem.modulesByModuleName[this.noderMainModule];
    moduleSystem.includeModule(mainModule);
    moduleSystem.resolveDependencies();
    var noderContent = moduleSystem.build().body;
    noderContent.push(new UglifyJS.AST_Return({
        value: mainModule.createVarRef()
    }));
    return noderContent;
};

NoderBootstrapPackage.prototype.getOutputJS = function(outputFile) {
    var content = configUtils.getBootstrapFileContent(this.noderConfig, outputFile);
    var config = this.noderEnvConfig.defConfig();
    merge(config, content.config, true);
    var configBody = jsToAST(config);
    if (content.packagesContent) {
        setJSONPropertyInAST(configBody, this.noderPackageConfigProperty, content.packagesContent);
    }

    var ast = wrapCode(this.noderEnvConfig.wrapper, {
        "$NODER_CONTENT$": content.noderContent,
        "$PACKAGED_CONFIG$": [new UglifyJS.AST_Return({
            value: configBody
        })]
    });
    ast = cloneNode(ast);

    ast = new UglifyJS.AST_Toplevel({
        body: NoderPackage.prototype.wrapOutputFile.call(this, outputFile, ast.body)
    });

    return ast;
};

NoderBootstrapPackage.prototype.wrapOutputFile = function(outputFile, packagesContent) {
    var noderContent = this.createNoderContent();
    configUtils.setBootstrapFileContent(this.noderConfig, outputFile, {
        config: this.noderConfigFullOptions,
        noderContent: noderContent,
        packagesContent: packagesContent.length > 0 ? getExpression(wrapCode(this.noderPackageWrapper, packagesContent)) : null
    });
    if (configUtils.skipCurrentBootstrapFileBuild(outputFile.packaging, this.noderConfig)) {
        return [];
    }
    return this.getOutputJS(outputFile).body;
};

NoderBootstrapPackage.prototype.rebuild = function(outputFile) {
    if (configUtils.skipCurrentBootstrapFileBuild(outputFile.packaging, this.noderConfig)) {
        return;
    }
    this.writeJSOutputFile(outputFile, this.getOutputJS(outputFile));
};

module.exports = NoderBootstrapPackage;
