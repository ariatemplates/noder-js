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

module.exports = function(grunt) {
    var pkg = require('./package.json');

    var licenseLong = grunt.file.read('tasks/templates/LICENSE-long');
    var licenseSmall = grunt.file.read('tasks/templates/LICENSE-small');

    var noderPackages = function(noderEnvironment) {
        return [{
            builder: {
                type: "NoderBootstrapPackage",
                cfg: {
                    noderEnvironment: noderEnvironment,
                    header: licenseLong
                }
            },
            name: "noder.js"
        }];
    };

    grunt.initConfig({
        pkg: pkg,
        clean: ['dist'],
        atpackager: {
            browser: {
                options: {
                    outputDirectory: "dist/browser",
                    packages: noderPackages("browser")
                }
            },
            node: {
                options: {
                    outputDirectory: "dist/node",
                    packages: noderPackages("node")
                }
            },
            options: {
                sourceDirectories: [],
                sourceFiles: [],
                visitors: ["NoderPlugins"]
            }
        },
        uglify: {
            options: {
                banner: licenseSmall
            },
            browser: {
                src: ['dist/browser/noder.js'],
                dest: 'dist/browser/noder.min.js'
            },
            node: {
                src: ['dist/node/noder.js'],
                dest: 'dist/node/noder.min.js'
            }
        },
        gzip: {
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
        jshint: {
            sources: ['package.json', '*.js', 'tasks/**/*.js', 'build/**/*.js', 'src/**/*.js', 'spec/**/*.js', '!spec/**/*.error.js', '!spec/browser/json2.js'],
            dist: ['dist/*/noder.js'],
            options: {
                debug: true,
                unused: true,
                eqnull: true
            }
        },
        mocha: {
            src: 'spec/**/*.spec.js',
            options: {
                ui: 'tdd',
                reporter: "spec"
            }
        },
        watch: {
            files: '<%= jshint.sources %>',
            tasks: ['dev']
        },
        karma: {
            options: {
                frameworks: ['mocha', 'expect'],
                plugins: [
                    'karma-*'
                ],
                files: [
                    'spec/browser/json2.js',
                    'spec/browser/injectNoder.js',
                    'spec/browser/**/*.spec.js', {
                        pattern: 'dist/browser/**',
                        included: false
                    }, {
                        pattern: 'spec/browser/**',
                        included: false
                    }
                ],
                browsers: ['Firefox', 'PhantomJS'],
                // global config for SauceLabs
                sauceLabs: {
                    username: 'ariatemplates',
                    accessKey: '620e638e-90d2-48e1-b66c-f9505dcb888b',
                    testName: 'noder runtime tests'
                },
                customLaunchers: {
                    'SL_Chrome': {
                        base: 'SauceLabs',
                        browserName: 'chrome',
                        platform: 'Linux',
                        version: '30'
                    },
                    'SL_Firefox': {
                        base: 'SauceLabs',
                        browserName: 'firefox',
                        platform: 'Linux'
                    },
                    'SL_Safari_6': {
                        base: 'SauceLabs',
                        browserName: 'safari',
                        platform: 'OS X 10.8',
                        version: '6'
                    },
                    'SL_IE_7': {
                        base: 'SauceLabs',
                        browserName: 'internet explorer',
                        platform: 'Windows XP',
                        version: '7'
                    },
                    'SL_IE_8': {
                        base: 'SauceLabs',
                        browserName: 'internet explorer',
                        platform: 'Windows 7',
                        version: '8'
                    },
                    'SL_IE_9': {
                        base: 'SauceLabs',
                        browserName: 'internet explorer',
                        platform: 'Windows 2008',
                        version: '9'
                    },
                    'SL_IE_10': {
                        base: 'SauceLabs',
                        browserName: 'internet explorer',
                        platform: 'Windows 2012',
                        version: '10'
                    },
                    'SL_IE_11': {
                        base: 'SauceLabs',
                        browserName: 'internet explorer',
                        platform: 'Windows 8.1',
                        version: '11'
                    },
                    'IOS': {
                        base: 'SauceLabs',
                        browserName: 'iphone',
                        platform: 'OS X 10.8',
                        version: '6.1'
                    },
                    'ANDROID': {
                        base: 'SauceLabs',
                        browserName: 'ANDROID',
                        platform: 'Linux',
                        version: '4.0'
                    }
                }
                //logLevel: 'LOG_INFO'
            },
            unit: {
                singleRun: true
            },
            tdd: {
                singleRun: false,
                autoWatch: true
            },
            ci: {
                sauceLabs: {
                    startConnect: false,
                    tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
                },
                transports: ['xhr-polling'],
                singleRun: true,
                browsers: ['PhantomJS', 'SL_IE_7', 'SL_IE_8', 'SL_IE_9', 'SL_IE_10', 'SL_IE_11', 'SL_Firefox', 'SL_Chrome', 'ANDROID'],
                reporters: ['dots', 'saucelabs']
            },
            sauce: {
                singleRun: true,
                browsers: ['PhantomJS', 'SL_IE_7', 'SL_IE_8', 'SL_IE_9', 'SL_IE_10', 'SL_IE_11', 'SL_Firefox', 'SL_Chrome', 'ANDROID'],
                reporters: ['dots', 'saucelabs']
            }
        },
        jsbeautifier: {
            update: {
                src: '<%= jshint.sources %>'
            },
            check: {
                src: '<%= jshint.sources %>',
                options: {
                    mode: "VERIFY_ONLY"
                }
            }
        }
    });

    grunt.loadTasks("tasks/internal");
    grunt.loadNpmTasks('atpackager');
    require('atpackager').loadPlugin('./atpackager');
    grunt.loadNpmTasks('grunt-jsbeautifier');
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks('grunt-karma');
    grunt.registerTask('build', ['clean', 'atpackager', 'uglify', 'gzip']);
    grunt.registerTask('test', ['jsbeautifier:check', 'jshint', 'mocha', 'karma:unit']);
    grunt.registerTask('ci', ['jsbeautifier:check', 'jshint', 'mocha', 'karma:ci']);
    grunt.registerTask('beautify', ['jsbeautifier:update']);
    grunt.registerTask('dev', ['beautify', 'build', 'jshint']);
    grunt.registerTask('default', ['build', 'test']);
};
