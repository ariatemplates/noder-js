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

module.exports = function(atpackager) {
    require("./atpackager").init(atpackager);
    atpackager.builders.NoderPackage = require("./builders/NoderPackage");
    atpackager.builders.NoderBootstrapPackage = require("./builders/NoderBootstrapPackage");
    atpackager.visitors.NoderDependencies = require("./visitors/NoderDependencies");
    atpackager.visitors.NoderMap = require("./visitors/NoderMap");
    atpackager.visitors.NoderResolverMap = require("./visitors/NoderResolverMap");
    atpackager.visitors.NoderRequiresGenerator = require("./visitors/NoderRequiresGenerator");
    atpackager.visitors.NoderPlugins = require("./visitors/NoderPlugins");
    atpackager.visitors.NoderExportVars = require("./visitors/NoderExportVars");
};
