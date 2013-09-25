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
var UglifyJS = atpackager.uglify;
var wrapCode = atpackager.uglifyHelpers.wrapCode;
var uglifyContentProvider = atpackager.contentProviders.uglifyJS;

var createRequireNode = function(requireFunction) {
    return function(path) {
        path = path.replace(/\\/g, "/");
        return new UglifyJS.AST_SimpleStatement({
            body: new UglifyJS.AST_Call({
                expression: new UglifyJS.AST_SymbolRef({
                    name: requireFunction
                }),
                args: [new UglifyJS.AST_String({
                    value: path
                })]
            })
        });
    };
};

var NoderRequiresGenerator = function(cfg) {
    cfg = cfg || {};
    this.requires = cfg.requires || [];
    this.requireFunction = cfg.requireFunction || "require";
    this.wrapper = cfg.wrapper || "$CONTENT$";
    this.targetLogicalPath = cfg.targetLogicalPath;
};

NoderRequiresGenerator.prototype.onInit = function(packaging) {
    var sourceFile = packaging.addSourceFile(this.targetLogicalPath);
    sourceFile.contentProvider = uglifyContentProvider;
    var ast = wrapCode(this.wrapper, this.requires.map(createRequireNode(this.requireFunction)));
    uglifyContentProvider.setAST(sourceFile, ast);
};

module.exports = NoderRequiresGenerator;
