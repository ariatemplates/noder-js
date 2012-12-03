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

module.exports = function (grunt) {
    grunt.registerMultiTask('testacular_start', 'testacular start', function () {
        var testacularServer = require('testacular').server;
        var dontWait = this.data.dontWait;
        delete this.data.dontWait;
        testacularServer.start(this.data);
        var done = this.async(); // just specify that the task is async, testacular ends the process itself
        if (dontWait) {
            setTimeout(done, 2000); // wait 2 s for Testacular to be started
        }
    });

    grunt.registerMultiTask('testacular_run', 'testacular run', function () {
        var testacularRunner = require('testacular').runner;
        var done = this.async();
        testacularRunner.run(this.data, function (exitCode) {
            if (exitCode !== 0) {
                grunt.warn("Error when running testacular.", exitCode);
            }
            done();
        });
    });
};