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

var path = require('path');
var atpackager = require('../atpackager').atpackager();
var grunt = atpackager.grunt;
var fileLoader = atpackager.contentProviders.fileLoader;

var acornReadOptions = {
    encoding: "utf8"
};
var acornContent;
var getAcornContent = function() {
    if (!acornContent) {
        try {
            var out = ["/** @license\nLicense for acorn.js:\n\n"];
            var acornPath = require.resolve('acorn/acorn.js');
            var acornLicense = require.resolve('acorn/LICENSE');
            out.push(grunt.file.read(acornLicense, acornReadOptions));
            out.push("\n**/\n");
            out.push(grunt.file.read(acornPath, acornReadOptions));
            acornContent = out.join("");
        } catch (e) {
            // this may happen when dev dependencies are not installed
            // use the already built version in the dist folder
            var acornPath = path.join(__dirname, "../../dist/browser/noderError/acorn.js");
            acornContent = grunt.file.read(acornPath, acornReadOptions);
        }
    }
    return acornContent;
};
var pluginsPath = path.resolve(__dirname, "../../src/plugins");

var NoderPlugins = function(cfg) {
    cfg = cfg || {};
    this.targetFiles = cfg.targetFiles || ["**/*"];
    if (!cfg.customPackage) {
        this.builder = cfg.builder || {
            type: "Concat"
        };
    }
    this.targetBaseLogicalPath = cfg.targetBaseLogicalPath || "";
};

NoderPlugins.prototype.onInit = function(packaging) {
    var pluginsFiles = grunt.file.expand({
        filter: "isFile",
        cwd: pluginsPath
    }, ["**/*.js"]);
    pluginsFiles.forEach(function(file) {
        this._addFile(packaging, path.join(pluginsPath, file), file);
    }, this);
    this._addFile(packaging, null, "noderError/acorn.js", getAcornContent());
};

NoderPlugins.prototype._addFile = function(packaging, absolutePath, logicalPath, textContent) {
    logicalPath = path.join(this.targetBaseLogicalPath, logicalPath);
    if (!grunt.file.isMatch(this.targetFiles, [logicalPath])) {
        return;
    }
    var sourceFile = packaging.addSourceFile(logicalPath);
    if (absolutePath) {
        sourceFile.contentProvider = fileLoader;
        fileLoader.setLoadPath(sourceFile, absolutePath);
    } else {
        sourceFile.setTextContent(textContent);
    }
    if (this.builder) {
        var targetFile = packaging.addOutputFile(logicalPath, true);
        targetFile.builder = packaging.createObject(this.builder, atpackager.builders);
        sourceFile.setOutputFile(targetFile);
    }
};

module.exports = NoderPlugins;
