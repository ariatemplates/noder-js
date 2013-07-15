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

// This file contains a utility method to replace a node by another in an UglifyJS2 AST.

var replaceNodeInArray = function(array, oldNode, newNode) {
    for (var i = 0, l = array.length; i < l; i++) {
        if (array[i] === oldNode) {
            if (newNode) {
                array[i] = newNode;
            } else {
                array.splice(i, 1);
            }
            return true;
        }
    }
    return false;
};

var replaceNodeInProperties = function(parent, oldNode, newNode) {
    var properties = parent.CTOR.PROPS;
    for (var i = 0, l = properties.length; i < l; i++) {
        var curProperty = properties[i];
        var curValue = parent[curProperty];
        if (curValue === oldNode) {
            if (newNode) {
                parent[curProperty] = newNode;
            } else {
                delete parent[curProperty];
            }
            return true;
        } else if (Array.isArray(curValue)) {
            if (replaceNodeInArray(curValue, oldNode, newNode)) {
                return true;
            }
        }
    }
    return false;
};

module.exports = function(node, parent, newNode) {
    if (newNode && !newNode.start) {
        // this is needed because of a bug in uglify-js if start is not defined on some specific nodes
        newNode.start = {
            comments_before: []
        };
    }
    if (replaceNodeInProperties(parent, node, newNode)) {
        return;
    }
    throw new Error("Internal error: unable to find the node to replace");
};
