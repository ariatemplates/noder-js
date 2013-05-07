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

var Context = require("./context.js");
var merge = require("./merge.js");

var ContextBuilder = function(config) {
    this._cfg = config;
};

var contextBuilderProto = ContextBuilder.prototype = {};

contextBuilderProto.config = function(config) {
    return new ContextBuilder(merge([config, this._cfg]));
};

var createContext = function(config) {
    var res = new ContextBuilder(config);
    return config ? res.create() : res;
};

contextBuilderProto.create = function() {
    var context = new Context(this._cfg);
    var rootModule = context.rootModule;
    rootModule.createContext = createContext;
    return rootModule;
};

module.exports = createContext();
