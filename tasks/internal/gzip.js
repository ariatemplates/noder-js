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

// grunt-contrib-compress has compression level issues. That's why we use gzip-js here.
module.exports = function(grunt) {
    var gzip = require('gzip-js');

    grunt.registerMultiTask('gzip', 'Gzips files.', function() {
        var options = this.options();

        this.files.forEach(function(file) {
            var src = file.src;
            if (src.length !== 1) {
                grunt.log.warn('There should be a single source file for destination ' + file.dest + '. Found: ' + src.join());
                return;
            }
            src = src[0];
            var srcContent = grunt.file.read(src);
            var sizeBefore = srcContent.length;
            var output = gzip.zip(srcContent, options);
            var sizeAfter = output.length;
            var compressionRate = Math.floor(100 * (sizeBefore - sizeAfter) / sizeBefore);
            grunt.log.writeln("Before gzip " + src.cyan + " : " + ("" + sizeBefore).yellow + " bytes");
            grunt.log.writeln("After gzip " + file.dest.cyan + " : " + ("" + output.length).yellow + " bytes (gain: " + ("" + compressionRate).yellow + " %)");
            grunt.file.write(file.dest, new Buffer(output));
        });
    });
};
