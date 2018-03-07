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
    var doc = require('./build/doc');

    var licenseLong = grunt.file.read('tasks/templates/LICENSE-long');
    var licenseSmall = grunt.file.read('tasks/templates/LICENSE-small');

    var atpackagerCfg = function(noderEnvironment) {
        return {
            options: {
                outputDirectory: "dist/" + noderEnvironment,
                sourceDirectories: [],
                sourceFiles: [],
                visitors: ["NoderPlugins"],
                packages: [{
                    builder: {
                        type: "NoderBootstrapPackage",
                        cfg: {
                            noderEnvironment: noderEnvironment,
                            header: licenseLong
                        }
                    },
                    name: "noder.js"
                }]
            }
        };
    };

    var atpackagerCfgDev = function(noderEnvironment) {
        return {
            options: {
                outputDirectory: "dist/" + noderEnvironment,
                sourceDirectories: [],
                sourceFiles: [],
                visitors: [{
                    type: 'JSStripBanner',
                    cfg: {
                        files: ["**/*.js", "!**/acorn.js"]
                    }
                }, {
                    type: 'NoderDependencies',
                    cfg: {
                        externalDependencies: ['noder-js/**']
                    }
                }, "CheckDependencies", {
                    type: "NoderPlugins",
                    cfg: {
                        customPackage: true
                    }
                }],
                packages: [{
                    builder: {
                        type: "NoderBootstrapPackage",
                        cfg: {
                            noderEnvironment: noderEnvironment,
                            header: licenseLong,
                            noderPackageConfigProperty: "errorContext.packaging.bootstrap",
                            noderConfigErrorOptions: {
                                main: "noderError/error.js",
                                packaging: {
                                    baseUrl: "",
                                    requestConfig: null
                                }
                            }
                        }
                    },
                    name: "noder.dev.js",
                    files: ["noderError/*.js"]
                }]
            }
        };
    };

    grunt.initConfig({
        pkg: pkg,
        clean: ['dist'],
        atpackager: {
            browser: atpackagerCfg("browser"),
            node: atpackagerCfg("node"),
            browserDev: atpackagerCfgDev("browser"),
            nodeDev: atpackagerCfgDev("node")
        },
        uglify: {
            options: {
                banner: licenseSmall,
                preserveComments: "some",
                beautify: {
                    ascii_only: true
                }
            },
            browser: {
                src: ['dist/browser/noder.js'],
                dest: 'dist/browser/noder.min.js'
            },
            node: {
                src: ['dist/node/noder.js'],
                dest: 'dist/node/noder.min.js'
            },
            browserDev: {
                src: ['dist/browser/noder.dev.js'],
                dest: 'dist/browser/noder.dev.min.js'
            },
            nodeDev: {
                src: ['dist/node/noder.dev.js'],
                dest: 'dist/node/noder.dev.min.js'
            }
        },
        gzip: {
            browser: {
                files: {
                    'dist/browser/noder.min.js.gz': 'dist/browser/noder.min.js',
                    'dist/browser/noder.dev.min.js.gz': 'dist/browser/noder.dev.min.js'
                }
            },
            node: {
                files: {
                    'dist/node/noder.min.js.gz': 'dist/node/noder.min.js',
                    'dist/node/noder.dev.min.js.gz': 'dist/node/noder.dev.min.js'
                }
            }
        },
        compress: {
            noderBrowserZip: {
                options: {
                    archive: "dist/noder-browser.zip"
                },
                files: [{
                    expand: true,
                    cwd: 'dist/browser',
                    src: ['**/*.js']
                }]

            }
        },
        jshint: {
            sources: ['package.json', '*.js', 'tasks/**/*.js', 'build/**/*.js', 'src/**/*.js', 'spec/**/*.js', '!spec/**/*.error.js', '!spec/browser/json2.js'],
            dist: ['dist/*/noder.js'],
            options: {
                debug: true,
                unused: true,
                eqnull: true,
                "-W079": true
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
                        pattern: 'src/browser-modules/**',
                        included: false
                    }, {
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
                    username: process.env.SAUCE_USERNAME,
                    accessKey: process.env.SAUCE_ACCESS_KEY,
                    testName: 'noder runtime tests'
                },
                customLaunchers: {
                    'SL_Chrome': {
                        base: 'SauceLabs',
                        browserName: 'chrome',
                        platform: 'Windows 7',
                        version: 'latest'
                    },
                    'SL_Firefox': {
                        base: 'SauceLabs',
                        browserName: 'firefox',
                        platform: 'Windows 7',
                        version: 'latest'
                    },
                    'SL_Safari_7': {
                        base: 'SauceLabs',
                        browserName: 'safari',
                        platform: 'OS X 10.9',
                        version: '7'
                    },
                    'SL_Safari_8': {
                        base: 'SauceLabs',
                        browserName: 'safari',
                        platform: 'OS X 10.10',
                        version: '8'
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
                    'SL_Edge': {
                        base: 'SauceLabs',
                        browserName: 'MicrosoftEdge',
                        platform: 'Windows 10',
                        version: 'latest'
                    },
                    'SL_iOS': {
                        base: 'SauceLabs',
                        browserName: 'Safari',
                        appiumVersion: '1.6.3',
                        deviceName: 'iPhone Simulator',
                        deviceOrientation: 'portrait',
                        platformVersion: '10.0',
                        platformName: 'iOS'
                    },
                    'SL_Android_4.4': {
                        base: 'SauceLabs',
                        browserName: 'Browser',
                        appiumVersion: '1.5.3',
                        deviceName: 'Android Emulator',
                        deviceOrientation: 'portrait',
                        platformVersion: '4.4',
                        platformName: 'Android'
                    },
                    'SL_Android_5.0': {
                        base: 'SauceLabs',
                        browserName: 'Browser',
                        appiumVersion: '1.5.3',
                        deviceName: 'Android Emulator',
                        deviceOrientation: 'portrait',
                        platformVersion: '5.0',
                        platformName: 'Android'
                    },
                    'SL_Android_5.1': {
                        base: 'SauceLabs',
                        browserName: 'Browser',
                        appiumVersion: '1.5.3',
                        deviceName: 'Android Emulator',
                        deviceOrientation: 'portrait',
                        platformVersion: '5.1',
                        platformName: 'Android'
                    }
                }
            },
            unit: {
                singleRun: true
            },
            tdd: {
                singleRun: false,
                autoWatch: true
            },
            ci1: {
                sauceLabs: {
                    startConnect: false,
                    tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
                },
                transports: ['xhr-polling'],
                singleRun: true,
                captureTimeout: 0,
                browserNoActivityTimeout: 0,
                client: {
                    mocha: {
                        timeout: 60000
                    }
                },
                browsers: ['PhantomJS', 'SL_Chrome', 'SL_Firefox', 'SL_Safari_8', 'SL_Edge', 'SL_Android_5.1'],
                reporters: ['dots', 'saucelabs']
            },
            ci2: {
                sauceLabs: {
                    startConnect: false,
                    tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
                },
                transports: ['xhr-polling'],
                singleRun: true,
                captureTimeout: 0,
                browserNoActivityTimeout: 0,
                client: {
                    mocha: {
                        timeout: 60000
                    }
                },
                browsers: ['SL_Android_4.4', 'SL_Android_5.0', 'SL_IE_11', 'SL_iOS', 'SL_Safari_7'],
                reporters: ['dots', 'saucelabs']
            },
            ci3: {
                sauceLabs: {
                    startConnect: false,
                    tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
                },
                transports: ['xhr-polling'],
                singleRun: true,
                captureTimeout: 0,
                browserNoActivityTimeout: 0,
                client: {
                    mocha: {
                        timeout: 60000
                    }
                },
                browsers: ['SL_IE_7', 'SL_IE_8', 'SL_IE_9', 'SL_IE_10'],
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
        },
        copy: {
            docData: {
                files: [{
                    expand: true,
                    cwd: 'doc',
                    src: ['**', '!**/*.md', '!**/*.html'],
                    dest: 'dist/doc'
                }]
            },
            docHtml: {
                options: {
                    process: function(content /*, path*/ ) {
                        return content.replace(/\%NODERJSVERSION\%/g, pkg.version);
                    }
                },
                files: [{
                    expand: true,
                    cwd: 'doc',
                    src: ['**/*.html'],
                    dest: 'dist/doc'
                }]
            }
        },
        markdown: {
            doc: {
                options: {
                    template: "tasks/templates/documentation.html",
                    preCompile: doc.preCompile,
                    postCompile: doc.postCompile,
                    markdownOptions: {
                        highlight: doc.highlight,
                        gfm: true
                    }
                },
                files: [{
                    expand: true,
                    cwd: 'doc',
                    src: ['**/*.md', '!README.md'],
                    dest: 'dist/doc',
                    ext: '.html'
                }]
            }
        }
    });

    require('load-grunt-tasks')(grunt);
    grunt.loadTasks("tasks/internal");
    grunt.loadNpmTasks('atpackager');
    require('atpackager').loadPlugin('./atpackager');

    grunt.registerTask('build', ['clean', 'atpackager', 'uglify', 'gzip', 'compress', 'doc']);
    grunt.registerTask('test', ['jsbeautifier:check', 'jshint', 'mocha', 'karma:unit']);
    grunt.registerTask('ci', ['jsbeautifier:check', 'jshint', 'mocha', 'karma:ci1', 'karma:ci2', 'karma:ci3']);
    grunt.registerTask('doc', ['copy:docData', 'copy:docHtml', 'markdown:doc']);
    grunt.registerTask('beautify', ['jsbeautifier:update']);
    grunt.registerTask('dev', ['beautify', 'build', 'jshint']);
    grunt.registerTask('default', ['build', 'test']);
};
