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
    var pkg = require('./package.json');
    var config = pkg.config;
    var env = process.env;
    // The environment variable is defined when grunt is run from npm.
    var testBrowsersCfg = env.npm_config_test_browsers || config['test-browsers'];

    grunt.initConfig({
        noder: {
            browser: {
                env: "browser",
                dest: 'dist/browser/noder.js'
            },
            node: {
                env: "node",
                dest: 'dist/node/noder.js'
            }
        },
        min: {
            browser: {
                src: ['dist/browser/noder.js'],
                dest: 'dist/browser/noder.min.js'
            },
            node: {
                src: ['dist/node/noder.js'],
                dest: 'dist/node/noder.min.js'
            }
        },
        compress: {
            browser: {
                files: {
                    'dist/browser/noder.min.js.gz': 'dist/browser/noder.min.js'
                }
            },
            node: {
                files: {
                    'dist/node/noder.min.js.gz': 'dist/node/noder.min.js'
                }
            }
        },
        lint: {
            sources: ['package.json', 'grunt.js', 'tasks/**/*.js', 'src/**/*.js', 'spec/**/*.js'],
            dist: ['dist/*/noder.js']
        },
        watch: {
            files: ['<config:lint.sources>'],
            tasks: ['dev']
        },
        jshint: {
            options: {
                debug: true,
                unused: true
            }
        },
        jasmine_node: {
            forceExit: true,
            projectRoot: "./spec"
        },
        noder_testacular: {
            integration: {
                configFile: './spec/browser/testacular.conf.js',
                browsers: testBrowsersCfg.split(','),
                singleRun: true
            }
        },
        beautify: {
            all: ['<config:lint.sources>']
        },
        beautifier: {
            options: {
                indentSize: 4,
                indentChar: ' '
            }
        }
    });

    grunt.loadTasks("tasks");
    grunt.loadNpmTasks('grunt-beautify');
    grunt.loadNpmTasks("grunt-jasmine-node");
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.registerTask('build', 'noder min compress');
    // noder_testacular must always be the last task to run (it terminates the process)
    grunt.registerTask('test', 'lint jasmine_node noder_testacular');
    grunt.registerTask('dev', 'beautify build lint');
    grunt.registerTask('default', 'build test');
};