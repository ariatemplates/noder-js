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
var internalRequire;
var internalDefine;

(function() {
    // This function defines a very small and simple internal module system for the loader itself.
    // It does not support circular dependencies and supposes all the modules are defined from the beginning.
    var modulesDef = {};
    var modules = {};

    internalRequire = function(moduleIndex) {
        var res = modules[moduleIndex];
        if (!res) {
            res = modulesDef[moduleIndex];
            if (res) {
                var module = {
                    exports: {}
                };
                res(module);
                res = modules[moduleIndex] = module.exports;
                modulesDef[moduleIndex] = null; // release some memory if possible
            } else {
                throw new Error("Missing internal module: " + moduleIndex);
            }
        }
        return res;
    };
    internalDefine = function(moduleIndex, moduleDef) {
        modulesDef[moduleIndex] = moduleDef;
    };
})();
