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
var uglifyContentProvider = atpackager.contentProviders.uglifyJS;

var NoderExportVars = function(cfg) {
    cfg = cfg || {};
    this.files = cfg.files || ['**/*.js'];
};

NoderExportVars.prototype.onWriteInputFile = function(packaging, outputFile, inputFile) {
    if (!inputFile.isMatch(this.files)) {
        return;
    }
    var ast = uglifyContentProvider.getAST(inputFile);
    if (ast) {
        ast.figure_out_scope();
        var body = ast.body;
        ast.variables.each(function(myVar) {
            var varName = myVar.name;
            body.push(new UglifyJS.AST_SimpleStatement({
                body: new UglifyJS.AST_Assign({
                    left: new UglifyJS.AST_Dot({
                        expression: new UglifyJS.AST_SymbolRef({
                            name: "exports"
                        }),
                        property: varName
                    }),
                    operator: "=",
                    right: new UglifyJS.AST_SymbolRef({
                        name: varName
                    })
                })
            }));
        });
        inputFile.contentProvider = uglifyContentProvider; // makes sure the changed version is used
    }
};

module.exports = NoderExportVars;
