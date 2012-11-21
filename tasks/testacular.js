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
    grunt.registerMultiTask('noder_testacular', 'Starts testacular.', function () {
        var task = this;
        var testacularServer = require('testacular').server;
        var connect = require('connect');
        var path = require('path');
        task.async(); // just specify that the task is async, testacular ends the process itself
        var webServer = connect(connect['static'](path.join(__dirname, '..'))).listen(0, function () {
            var webServerPort = webServer.address().port;
            var proxies = task.data.proxies;
            if (!proxies) {
                task.data.proxies = proxies = {};
            }
            task.data.proxies['/noder/'] = "http://localhost:" + webServerPort + "/";
            testacularServer.start(task.data);
        });
    });
};