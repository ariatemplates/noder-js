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

module.exports = function(grunt, name, cmd) {
    grunt.registerMultiTask(name, 'Run ' + cmd, function() {
        var spawn = require('child_process').spawn;

        var files = this.filesSrc;
        var args = [];
        args.push(cmd);
        var options = this.options();
        for (var key in options) {
            if (options.hasOwnProperty(key)) {
                var value = options[key];
                if (!Array.isArray(value)) {
                    value = [value];
                }
                for (var i = 0, l = value.length; i < l; i++) {
                    args.push("--" + key);
                    args.push(value[i]);
                }
            }
        }
        args.push.apply(args, files);
        grunt.log.writeln("Executing " + args.join(' '));
        var done = this.async();
        var proc = spawn(process.argv[0], args, {
            stdio: 'inherit'
        });
        proc.on('exit', function(exitCode) {
            if (exitCode !== 0) {
                grunt.warn("Exit code from " + cmd + ": " + exitCode);
            }
            done();
        });
    });
};
