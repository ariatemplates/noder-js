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

var UglifyJS = require("../atpackager").atpackager().uglify;

/**
 * Analyses the AST of a file and returns its require dependencies
 * @param {Object} ast uglify-js abstract syntax tree
 * @return {Array} array of objects
 */
module.exports = function(ast) {
    var res = [];
    var walker = new UglifyJS.TreeWalker(function(node) {
        if (node instanceof UglifyJS.AST_String) {
            var parent = walker.parent();
            if (parent instanceof UglifyJS.AST_Call && parent.args.length === 1 && parent.expression instanceof UglifyJS.AST_SymbolRef) {
                var functionName = parent.expression.name;
                if (functionName === "require" && parent.expression.thedef.undeclared) {
                    res.push({
                        dependency: node.value,
                        requireNode: parent,
                        parentNode: walker.parent(1)
                    });
                }
            }
        }
    });
    ast.walk(walker);
    return res;
};
