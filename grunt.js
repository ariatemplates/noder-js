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
            forceExit: true
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
    grunt.registerTask('build', 'noder min');
    grunt.registerTask('test', 'lint jasmine_node');
    grunt.registerTask('dev', 'beautify build lint');
    grunt.registerTask('default', 'build test');

};