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

var util = require('util');
var findRequires = require('../../findRequires');

var atpackager = require('../atpackager').atpackager();

var JSConcat = atpackager.builders.JSConcat;
var UglifyJS = atpackager.uglify;
var uglifyHelpers = atpackager.uglifyHelpers;
var wrapCode = uglifyHelpers.wrapCode;
var getExpression = uglifyHelpers.getExpression;
var jsToAST = uglifyHelpers.jsToAST;

var NoderPackage = function(cfg) {
    cfg = cfg || {};
    if (cfg.moduleFunction) {
        this.moduleFunction = "(" + cfg.moduleFunction + ")";
    }

    JSConcat.call(this, cfg); // parent constructor
};

util.inherits(NoderPackage, JSConcat);

NoderPackage.prototype.moduleFunction = "(" + require('../../context').prototype.jsModuleEval("$CONTENT$") + ")";

NoderPackage.prototype.wrapInputFile = function(outputFile, sourceFile, sourceFileContent) {
    sourceFileContent = JSConcat.prototype.wrapInputFile.call(this, outputFile, sourceFile, sourceFileContent);
    var dependencies = jsToAST(this.getDependencies(sourceFileContent));
    var moduleFunction = getExpression(wrapCode(this.moduleFunction, sourceFileContent));
    return [new UglifyJS.AST_SimpleStatement({
        body: new UglifyJS.AST_Call({
            expression: new UglifyJS.AST_SymbolRef({
                name: "define"
            }),
            args: [new UglifyJS.AST_String({
                value: sourceFile.logicalPath.replace(/\\/g, '/')
            }), dependencies, moduleFunction]
        })
    })];
};

NoderPackage.prototype.getDependencies = function(statements) {
    // Even if we could use the AST to find requires, in order to be consistent with what's done client side,
    // let's use the the same code (re-parsing the code)
    var topLevel = new UglifyJS.AST_Toplevel({
        body: statements
    });
    var textContent = topLevel.print_to_string();
    return findRequires(textContent, true);
};

module.exports = NoderPackage;
