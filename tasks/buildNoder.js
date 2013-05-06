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

module.exports = function (grunt) {
    var path = require('path');
    var fileUtils = grunt.file;
    var log = grunt.log;

    // This regexp only matches calls to require for local modules (starting with './' or '../' or 'noder/')
    var requireRegexp = /(^|[^\s.])\s*\brequire\s*\(\s*["']((\.\.?|noder)\/[^"']+)["']\s*\)|(\/\*[\s\S]*?\*\/)|((?:[^\\]|^)\/\/.*?([\n\r]|$))/g;

    var getModuleName = function (modulePath) {
        return path.basename(modulePath, '.js');
    };

    var src = path.join(__dirname, '../src/');
    var envConfig = {
        "node": {
            header: "/*jshint undef:true, node:true*/\nmodule.exports = (function(){\n'use strict';\n",
            footer: "\n})()",
            modules: [path.join(src, 'modules/**/*.js'), path.join(src, 'node-modules/**/*.js')]
        },
        "browser": {
            header: "/*jshint undef:true*/\n(function(global,callEval){\n'use strict';\n",
            footer: "\n})((function(){return this;})(),function(c){\n/*jshint evil:true */\neval(c);\n})",
            modules: [path.join(src, 'modules/**/*.js'), path.join(src, 'browser-modules/**/*.js')]
        }
    };
    var internalModules = path.join(src, 'internalModules.js');

    var readFileStripBanner = function (path) {
        var content = grunt.file.read(path);
        content = content.replace(/^\s*\/\*[\s\S]*?\*\/\s*/, '');
        return content;
    };

    grunt.registerMultiTask("noder", "Build Noder with the specified parameters.", function () {
        var data = this.data;
        var envCfg = envConfig[data.env || "browser"];
        if (!envCfg) {
            log.error("Invalid value for the env parameter: " + data.env);
            return;
        }
        var modules = fileUtils.expand({
            filter: "isFile"
        }, envCfg.modules.concat(data.modules || []));
        var mainModule = getModuleName(data.main || "main");
        var banner = grunt.config.process(data.banner);
        var configFile = data.configFile;
        if (configFile) {
            configFile = fileUtils.read(configFile);
        }
        var moduleDefinitions = {};
        var output = [];
        for (var i = 0, l = modules.length; i < l; i++) {
            var modulePath = modules[i];
            var moduleName = getModuleName(modulePath);
            if (moduleDefinitions[moduleName]) {
                log.writeln('Overriding ' + moduleDefinitions[moduleName].path + ' with ' + modulePath);
            }
            moduleDefinitions[moduleName] = {
                path: modulePath,
                name: moduleName
            };
        }
        var toBeIncluded = [];

        var lastModuleNumber = 0;
        var getModuleNumber = function (moduleName) {
            var module = moduleDefinitions[moduleName];
            if (!module) {
                throw new Error("Missing module " + moduleName);
            }
            if (!module.number) {
                lastModuleNumber++;
                module.number = lastModuleNumber;
                toBeIncluded.push(module);
            }
            return module.number;
        };

        var requireReplacer = function (match, before, dependency) {
            if (arguments[4] || arguments[5] /* comments */ ) {
                return match;
            }
            var moduleName = path.basename(dependency, '.js');
            return [before, ' internalRequire(', getModuleNumber(moduleName), ' /* ', moduleName, ' */)'].join('');
        };

        var includeModule = function (module) {
            var moduleName = module.name;
            log.debug("Including module " + module.path);
            var fileContent = readFileStripBanner(module.path);
            fileContent = fileContent.replace(requireRegexp, requireReplacer);
            output.push('internalDefine(', module.number, ' /* ', moduleName, ' */, function (module) {\n\n', fileContent, '\n\n});\n\n');
        };

        var checkUnusedModules = function () {
            for (var moduleName in moduleDefinitions) {
                if (moduleDefinitions.hasOwnProperty(moduleName)) {
                    var curModule = moduleDefinitions[moduleName];
                    if (!curModule.number) {
                        log.writeln("Unused module " + curModule.path);
                    }
                }
            }
        };

        var composeFile = function () {
            output.push(banner);
            output.push(envCfg.header);
            output.push(readFileStripBanner(internalModules));
            getModuleNumber(mainModule);
            while (toBeIncluded.length) {
                includeModule(toBeIncluded.shift());
            }
            output.push("return internalRequire(", getModuleNumber(mainModule), ");");
            output.push(envCfg.footer);
            if (configFile) {
                output.push('.config(');
                output.push(configFile);
                output.push(')');
            }
            output.push('.create();');
        };
        try {
            composeFile();
            checkUnusedModules();
            fileUtils.write(data.dest, output.join(''));
        } catch (e) {
            log.error(e);
            return false;
        }
    });

};