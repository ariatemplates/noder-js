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
var grunt = atpackager.grunt;
var path = require('path');
var NoderPackage = require('../builders/NoderPackage');
var NoderBootstrapPackage = require('../builders/NoderBootstrapPackage');
var configUtils = require('../helpers/configUtils');

var normalizePath = function(filePath) {
    return path.normalize(filePath).split(path.sep).join('/'); // only forward slashes for the web
};

var addToMap = function(map, sourceFile, entry) {
    var sourcePathParts = path.normalize(sourceFile).split(path.sep);
    var currentObject = map;
    for (var i = 0, l = sourcePathParts.length - 1; i < l; i++) {
        var curPart = sourcePathParts[i];
        if (!currentObject[curPart]) {
            currentObject[curPart] = {};
        }
        currentObject = currentObject[curPart];
        if (typeof currentObject === "string") {
            grunt.log.error('NoderMap: conflicting entries in the map for ' + curPart.yellow + ' from ' +
                sourceFile.yellow);
        }
    }
    var lastPart = sourcePathParts[sourcePathParts.length - 1];
    if (currentObject.hasOwnProperty(lastPart)) {
        grunt.log.error('NoderMap: conflicting entries in the map for ' + lastPart.yellow + ' from ' +
            sourceFile.yellow);
    }
    currentObject[lastPart] = entry;
};

var NoderMap = function(cfg) {
    cfg = cfg || {};
    this.sourceFiles = cfg.sourceFiles || ['**/*']; // source files to take into account in the map
    this.outputFiles = cfg.outputFiles || ['**/*']; // output files to take into account in the map
    this.starCompress = cfg.hasOwnProperty('starCompress') ? cfg.starCompress : ['**/*'];
    this.starStarCompress = cfg.hasOwnProperty('starStarCompress') ? cfg.starStarCompress : ['**/*'];
    this.noderConfig = cfg.noderConfig;
    this.noderContext = cfg.noderContext;
    this.varName = cfg.varName || "noder";
    this.toFile = cfg.toFile;
};

NoderMap.prototype.onBeforeBuild = function(packaging) {
    if (!this.toFile) {
        configUtils.planBootstrapFileRebuild(packaging, this.noderConfig);
    }
};

NoderMap.prototype._starCompress = function(path, map) {
    var packageWithMaxFiles = null;
    var filesPerPackage = {};
    for (var file in map) {
        if (map.hasOwnProperty(file)) {
            var value = map[file];
            if (value instanceof Object) {
                this._starCompress(path + file + '/', value);
            } else {
                if (!filesPerPackage[value]) {
                    filesPerPackage[value] = [file];
                } else {
                    filesPerPackage[value].push(file);
                }
                if (packageWithMaxFiles == null ||
                    filesPerPackage[value].length > filesPerPackage[packageWithMaxFiles].length) {
                    packageWithMaxFiles = value;
                }
            }
        }
    }
    if (!grunt.file.isMatch(this.starCompress, [path])) {
        // prevent any change to the current path if it does not match the patterns
        return;
    }
    if (packageWithMaxFiles != null) {
        map['*'] = packageWithMaxFiles;
        filesPerPackage[packageWithMaxFiles].forEach(function(file) {
            delete map[file];
        });
    }
};

NoderMap.prototype._starStarCompress = function(path, map) {
    var packageWithMaxFiles = null;
    var filesPerPackage = {};
    var hasUnremovableEntries = false;
    for (var file in map) {
        if (map.hasOwnProperty(file)) {
            var value = map[file];
            var subStarStar = null;
            if (file == '*') {
                subStarStar = value;
            } else if (value instanceof Object) {
                subStarStar = this._starStarCompress(path + file + '/', value);
            }
            if (subStarStar) {
                if (!filesPerPackage[subStarStar]) {
                    filesPerPackage[subStarStar] = [file];
                } else {
                    filesPerPackage[subStarStar].push(file);
                }
                if (packageWithMaxFiles == null) {
                    packageWithMaxFiles = subStarStar;
                } else if (packageWithMaxFiles != subStarStar) {
                    // two different children with different ** values
                    hasUnremovableEntries = true;
                    if (filesPerPackage[subStarStar].length > filesPerPackage[packageWithMaxFiles].length) {
                        packageWithMaxFiles = subStarStar;
                    }
                }
            }
            if (!subStarStar) {
                hasUnremovableEntries = true;
            }
        }
    }
    if (!(grunt.file.isMatch(this.starCompress, [path]) && grunt.file.isMatch(this.starStarCompress, [path]))) {
        // prevent any change to the current path if it does not match the patterns
        return;
    }
    if (packageWithMaxFiles != null) {
        var onlyReplacingStarWithStarStar = filesPerPackage[packageWithMaxFiles].length == 1 &&
            filesPerPackage[packageWithMaxFiles][0] == '*';
        if (!onlyReplacingStarWithStarStar) {
            map['**'] = packageWithMaxFiles;
            filesPerPackage[packageWithMaxFiles].forEach(function(file) {
                delete map[file];
            });
        }
    }
    if (!hasUnremovableEntries) {
        return map['**'] || map['*'];
    }
};

NoderMap.prototype.onAfterBuild = function(packaging) {
    var map = this.toFile ? {} : configUtils.getPackagesMap(packaging, this.noderConfig, this.noderContext);
    var sourceFilesPatterns = this.sourceFiles;
    var outputFilesPatterns = this.outputFiles;
    var sourceFiles = packaging.sourceFiles;
    for (var file in sourceFiles) {
        var curSourceFile = sourceFiles[file];
        var outputFile = curSourceFile.outputFile;
        if (sourceFiles.hasOwnProperty(file) && outputFile) {
            var normalizedOutputFilePath = normalizePath(outputFile.logicalPath);
            var includeFile = true;
            includeFile = includeFile && outputFile.builder instanceof NoderPackage;
            includeFile = includeFile && !(outputFile.builder instanceof NoderBootstrapPackage);
            includeFile = includeFile && curSourceFile.isMatch(sourceFilesPatterns);
            includeFile = includeFile && outputFile.isMatch(outputFilesPatterns);
            if (includeFile) {
                addToMap(map, curSourceFile.logicalPath, normalizedOutputFilePath);
            }
        }
    }
    if (this.starCompress) {
        this._starCompress('', map);
        if (this.starStarCompress) {
            this._starStarCompress('', map);
        }
    }
    if (this.toFile) {
        grunt.file.write(path.join(packaging.outputDirectory, this.toFile), this.varName + ".updatePackagesMap(" + JSON.stringify(map) + ");");
    } else {
        configUtils.rebuildBootstrapFile(packaging, this.noderConfig);
    }
};

module.exports = NoderMap;
