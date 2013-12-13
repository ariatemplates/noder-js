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

var atpackager = require('../atpackager').atpackager();
var grunt = atpackager.grunt;
var findRequires = require('../helpers/findRequires');
var configUtils = require('../helpers/configUtils');
var uglifyContentProvider = atpackager.contentProviders.uglifyJS;

var RequireDependencies = function(cfg) {
    cfg = cfg || {};
    this.files = cfg.files || ['**/*.js'];
    this.mustExist = cfg.hasOwnProperty('mustExist') ? cfg.mustExist : true;
    this.externalDependencies = cfg.hasOwnProperty('externalDependencies') ? cfg.externalDependencies : [];
    this.noderConfig = cfg.noderConfig;
    this.noderContext = cfg.noderContext;
};

RequireDependencies.prototype.computeDependencies = function(packaging, inputFile) {
    if (!inputFile.isMatch(this.files)) {
        return;
    }
    var mustExist = this.mustExist;
    var externalDependencies = this.externalDependencies;
    var ast = uglifyContentProvider.getAST(inputFile);
    if (ast) {
        var resolver = this.resolver;
        if (!resolver) {
            resolver = this.resolver = configUtils.getResolver(packaging, this.noderConfig, this.noderContext);
        }

        ast.figure_out_scope();
        var dependencies = findRequires(ast);
        var callerModule = {
            filename: inputFile.logicalPath.replace(/\\/g, "/")
        };
        dependencies.forEach(function(relativeDependency) {
            relativeDependency = relativeDependency.dependency;
            var dependency = resolver.moduleResolve(callerModule, relativeDependency);
            var correspondingFile = packaging.getSourceFile(dependency);
            if (correspondingFile) {
                inputFile.addDependency(correspondingFile);
            } else if (mustExist && !grunt.file.isMatch(externalDependencies, [dependency])) {
                grunt.log.error(inputFile.logicalPath.yellow + " depends on " + relativeDependency.yellow +
                    " which cannot be found.");
            }
        });
    }
};

module.exports = RequireDependencies;
