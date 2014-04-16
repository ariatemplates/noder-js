# Contribute to noderJS

This page explains how to build Noder from sources. This is especially useful if you are planning to
contribute to this project. Note that if you only intend to use Noder, you can use the already
built version available in the [releases section](https://github.com/ariatemplates/noder-js/releases).

## Cloning and building noderJS

* First, ensure that you have [git](http://git-scm.com/), the latest [node.js](http://nodejs.org) and npm installed
(npm is bundled with the node.js installer).

* Then, get the sources of Noder with git:

```
git clone https://github.com/ariatemplates/noder-js.git noder
cd noder
```

* Download and install development dependencies with npm:

```
npm install
```

* Noder can then be built with [grunt](http://gruntjs.com/):

```
node node_modules/grunt/bin/grunt build
```

After the grunt command is finished you can find the built version in the dist directory:
 * ``dist/browser/noder.js`` : uncompressed version of Noder for web browsers
 * ``dist/browser/noder.min.js`` : minified version of Noder for web browsers
 * ``dist/node/noder.js`` : uncompressed version of Noder for node.js (useful for testing purposes)
 * ``dist/node/noder.min.js`` : minified version of Noder for node.js


Remember to beautify your code after adding or editing source files running the command:

```
grunt beautify
```

at the root of the repo in order to beautify all files.


## Running the test suite

To run the test suite, you can use:

```
npm test
```

Whit this command in fact you are doing more than just execute a test suite, you are performing a list of different actions like executing the build, checking all the ``.js`` and ``.json`` files using [JSHint](http://www.jshint.com/), running the whole test suite inside node.js and running the tests inside Firefox using [karma](http://karma-runner.github.io).
