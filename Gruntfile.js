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

    var licenseLong = grunt.file.read('tasks/templates/LICENSE-long');
    var licenseSmall = grunt.file.read('tasks/templates/LICENSE-small');

    grunt.initConfig({
        pkg : pkg,
        noder : {
            browser : {
                banner : licenseLong,
                env : "browser",
                dest : 'dist/browser/noder.js'
            },
            node : {
                banner : licenseLong,
                env : "node",
                dest : 'dist/node/noder.js'
            }
        },
        uglify : {
            options : {
                banner : licenseSmall
            },
            browser : {
                src : ['dist/browser/noder.js'],
                dest : 'dist/browser/noder.min.js'
            },
            node : {
                src : ['dist/node/noder.js'],
                dest : 'dist/node/noder.min.js'
            }
        },
        gzip : {
            browser : {
                files : {
                    'dist/browser/noder.min.js.gz' : 'dist/browser/noder.min.js'
                }
            },
            node : {
                files : {
                    'dist/node/noder.min.js.gz' : 'dist/node/noder.min.js'
                }
            }
        },
        jshint : {
            sources : ['package.json', 'grunt.js', 'tasks/**/*.js', 'src/**/*.js', 'spec/**/*.js'],
            dist : ['dist/*/noder.js'],
            options : {
                debug : true,
                unused : true
            }
        },
        mocha : {
            src : 'spec/**/*.spec.js',
            options : {
                ui : 'tdd',
                reporter : "spec"
            }
        },
        watch : {
            files : '<%= jshint.sources %>',
            tasks : ['dev']
        },
        testacular_start : {
            integration : {
                configFile : './spec/browser/testacular.conf.js',
                browsers : testBrowsersCfg.split(','),
                singleRun : true
            },
            dev : {
                configFile : './spec/browser/testacular.conf.js',
                browsers : testBrowsersCfg.split(','),
                singleRun : false,
                dontWait : true
            },
            coverage : {
                configFile : './spec/browser/testacular.conf.js',
                browsers : testBrowsersCfg.split(','),
                singleRun : true,
                preprocessors : {
                    '**/dist/browser/noder.js' : 'coverage'
                },
                reporters : ['coverage']
            }
        },
        testacular_run : {
            run : {}
        },
        beautify : {
            all : '<%= jshint.sources %>'
        },
        beautifier : {
            options : {
                indentSize : 4,
                indentChar : ' '
            }
        }
    });

    grunt.loadTasks("tasks");
    grunt.loadNpmTasks('grunt-beautify');
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.registerTask('build', ['noder', 'uglify', 'gzip']);
    // testacular_start without dontWait must always be the last task to run (it terminates the process)
    grunt.registerTask('test', ['jshint', 'mocha', 'testacular_start:integration']);
    grunt.registerTask('testacular', ['testacular_start:dev', 'dev', 'watch']);
    grunt.registerTask('dev', ['beautify', 'build', 'jshint', 'testacular_run']);
    grunt.registerTask('coverage', 'testacular_start:coverage');
    grunt.registerTask('default', ['build', 'test']);
};