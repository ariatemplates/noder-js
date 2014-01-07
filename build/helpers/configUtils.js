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

var DefaultResolver = require("../../src/modules/resolver");
var merge = require("../../src/modules/merge");
var noderConfigsKeyName = "noderConfigs" + (new Date()).getTime();

var getInfo = function(packaging, configName) {
    if (!configName) {
        configName = "default";
    }
    var configs = packaging[noderConfigsKeyName];
    if (!configs) {
        configs = packaging[noderConfigsKeyName] = {};
    }
    var info = configs[configName];
    if (!info) {
        info = configs[configName] = {
            config: {
                resolver: {
                    "default": {}
                },
                packaging: {
                    packagesMap: {}
                }
            },
            plannedBuilds: 1
        };
    }
    return info;
};

var getResolver = function(packaging, config) {
    if (config && config.moduleResolve) {
        return config;
    }
    var info = getInfo(packaging, config);
    if (!info.resolver) {
        info.resolver = new DefaultResolver({
            config: info.config
        });
    }
    return info.resolver;
};

var getResolverMap = function(packaging, config) {
    var info = getInfo(packaging, config);
    return info.config.resolver["default"];
};

var getPackagesMap = function(packaging, config) {
    var info = getInfo(packaging, config);
    return info.config.packaging.packagesMap;
};

var setBootstrapFileContent = function(config, outputFile, content) {
    var info = getInfo(outputFile.packaging, config);
    info.bootstrapFile = outputFile;
    info.noderContent = content.noderContent;
    info.packagesContent = content.packagesContent;
    merge(info.config, content.config);
};

var getBootstrapFileContent = function(config, outputFile) {
    var info = getInfo(outputFile.packaging, config);
    if (info.bootstrapFile !== outputFile) {
        throw new Error("Bootstrap file is not the same.");
    }
    return {
        noderContent: info.noderContent,
        packagesContent: info.packagesContent,
        config: info.config
    };
};

var rebuildBootstrapFile = function(packaging, config) {
    var info = getInfo(packaging, config);
    var file = info.bootstrapFile;
    file.builder.rebuild(file);
};

var planBootstrapFileRebuild = function(packaging, config) {
    var info = getInfo(packaging, config);
    info.plannedBuilds++;
};

var skipCurrentBootstrapFileBuild = function(packaging, config) {
    var info = getInfo(packaging, config);
    info.plannedBuilds--;
    return info.plannedBuilds > 0;
};

module.exports = {
    getPackagesMap: getPackagesMap,
    getResolverMap: getResolverMap,
    getResolver: getResolver,
    setBootstrapFileContent: setBootstrapFileContent,
    getBootstrapFileContent: getBootstrapFileContent,
    rebuildBootstrapFile: rebuildBootstrapFile,
    planBootstrapFileRebuild: planBootstrapFileRebuild,
    skipCurrentBootstrapFileBuild: skipCurrentBootstrapFileBuild
};
