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
var UglifyJS = atpackager.uglify;
var uglifyHelpers = atpackager.uglifyHelpers;
var replaceNode = uglifyHelpers.replaceNode;
var cloneNode = uglifyHelpers.cloneNode;

var constantTypes = [UglifyJS.AST_Number, UglifyJS.AST_String, UglifyJS.AST_Boolean];
var isAcceptedConstantType = function(node) {
    return constantTypes.some(function(type) {
        return node instanceof type;
    });
};

module.exports = function(ast, isConstant) {
    var extraInfoNodeName = "replaceConstantsInfo" + (new Date()).getTime();
    var symbols = [];
    var walker = new UglifyJS.TreeWalker(function(node) {
        if (node instanceof UglifyJS.AST_Symbol && node.thedef) {
            var thedef = node.thedef;
            var extraInfo = thedef[extraInfoNodeName];
            if (!extraInfo) {
                thedef[extraInfoNodeName] = extraInfo = {
                    name: thedef.name,
                    constant: true, // will be changed to false if the variable is assigned a value
                    usages: []
                };
                symbols.push(extraInfo);
            }
            var parent = walker.parent();
            if ((parent instanceof UglifyJS.AST_Assign && parent.left === node) || parent instanceof UglifyJS.AST_Unary) {
                extraInfo.constant = false;
            }
            if (parent instanceof UglifyJS.AST_VarDef && parent.name === node) {
                if (extraInfo.definition) {
                    // 2 different definitions
                    extraInfo.constant = false;
                }
                extraInfo.definition = {
                    varDef: parent,
                    varList: walker.parent(1),
                    varListParent: walker.parent(2)
                };
                extraInfo.value = parent.value;
            } else {
                extraInfo.usages.push({
                    node: node,
                    parent: parent
                });
            }
        }
    });
    ast.walk(walker);
    symbols.forEach(function(extraInfo) {
        if (extraInfo.constant && (isAcceptedConstantType(extraInfo.value) || isConstant(extraInfo.value))) {
            extraInfo.usages.forEach(function(usage) {
                var newNode = cloneNode(extraInfo.value);
                newNode.start = new UglifyJS.AST_Token({
                    comments_before: [{
                        type: "comment2",
                        value: extraInfo.name
                    }]
                });
                replaceNode(usage.node, usage.parent, newNode);
            });
            if (extraInfo.definition.varList.definitions.length > 1) {
                replaceNode(extraInfo.definition.varDef, extraInfo.definition.varList, null);
            } else {
                replaceNode(extraInfo.definition.varList, extraInfo.definition.varListParent, null);
            }
        }
    });
};
