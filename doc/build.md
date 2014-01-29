[Documentation index](index.md)

# Building Noder

This page explains how to build Noder from sources. This is especially useful if you are planning to
contribute to this project. Note that if you only intend to use Noder, you can use the already
built version available in the [releases section](https://github.com/ariatemplates/noder/releases).

## Cloning and building Noder

* First, ensure that you have [git](http://git-scm.com/), the latest [node.js](http://nodejs.org) and npm installed
(npm is bundled with the node.js installer).

* Then, get the sources of Noder with git:

```
git clone https://github.com/ariatemplates/noder.git noder
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

The built version can be found in the dist directory:
 * ``dist/browser/noder.js`` : uncompressed version of Noder for web browsers
 * ``dist/browser/noder.min.js`` : minified version of Noder for web browsers
 * ``dist/node/noder.js`` : uncompressed version of Noder for node.js (useful for testing purposes)
 * ``dist/node/noder.min.js`` : minified version of Noder for node.js

## Running the test suite

To run the test suite, you can use:

```
npm test
```

This command:
* executes the build
* checks ``.js`` and ``.json`` files with [JSHint](http://www.jshint.com/)
* runs the test suite in node.js
* runs tests with [karma](http://karma-runner.github.io) in Firefox.
