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

module.exports = function(grunt) {
    var path = require('path');
    var fileUtils = grunt.file;
    var log = grunt.log;
    var wrapCode = require("./helpers/wrapCode");
    var ModuleSystem = require("./helpers/moduleSystem")(grunt);
    var UglifyJS = require("uglify-js");

    var src = path.join(__dirname, '../src/');
    var envConfig = {
        "node": {
            wrapper: "/*jshint undef:true, node:true, -W069, -W055*/\nmodule.exports = (function(){\n'use strict';\n$CONTENT$;\n})();",
            modules: [path.join(src, 'modules/**/*.js'), path.join(src, 'node-modules/**/*.js')]
        },
        "browser": {
            wrapper: "/*jshint undef:true, -W069, -W055*/\n(function(global,callEval){\n'use strict';\n$CONTENT$\n})((function(){return this;})(),function(c){\n/*jshint evil:true */\neval(c);\n});",
            modules: [path.join(src, 'modules/**/*.js'), path.join(src, 'browser-modules/**/*.js')]
        }
    };

    grunt.registerMultiTask("noder", "Build Noder with the specified parameters.", function() {
        var data = this.data;
        var envCfg = envConfig[data.env || "browser"];
        if (!envCfg) {
            log.error("Invalid value for the env parameter: " + data.env);
            return;
        }
        var modules = fileUtils.expand({
            filter: "isFile"
        }, envCfg.modules.concat(data.modules || []));
        var banner = grunt.config.process(data.banner);
        var moduleSystem = new ModuleSystem();

        for (var i = 0, l = modules.length; i < l; i++) {
            var curModule = moduleSystem.addModule(modules[i]);
            if (curModule.parentModule) {
                log.writeln('Overriding ' + curModule.parentModule.fileName + ' with ' + curModule.fileName);
            }
        }

        var mainModule = moduleSystem.modulesByModuleName[data.main || "main"];
        moduleSystem.includeModule(mainModule);
        moduleSystem.resolveDependencies();
        var ast = moduleSystem.build();
        ast.body.push(new UglifyJS.AST_Return({
            value: mainModule.createVarRef()
        }));
        ast = wrapCode(banner + envCfg.wrapper, ast.body);
        var output = ast.print_to_string({
            comments: true,
            beautify: true,
            ascii_only: true
        });

        fileUtils.write(data.dest, output);
    });

};
