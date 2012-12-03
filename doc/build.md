[Documentation index](index.md)

# Building Noder

This page explains how to build Noder from sources. This is especially useful if you are planning to
contribute to this project. Note that if you only intend to use Noder, you can use the already
built version available in the [downloads section](https://github.com/ariatemplates/noder/downloads).

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

This command will first execute the build, then launch the test suite in node.js, and then run tests in PhantomJS and
Firefox with [testacular](http://vojtajina.github.com/testacular/). You need to have PhantomJS and Firefox installed
and available in the path for this to succeed.

If you want to change the browsers used for testing, you can use ``npm config``, for example:

```
npm config set test-browsers "Chrome,Safari"
```

Check in the [testacular project](https://github.com/vojtajina/testacular/wiki/Browsers) the list of
supported browsers to automatically run the test suite.

