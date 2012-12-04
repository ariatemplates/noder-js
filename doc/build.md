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

### Configuring browsers

By default, when running the test commands (as described in the next 3 sections), the browsers used for testing are
[PhantomJS](http://phantomjs.org/) and [Firefox](https://www.mozilla.org/en-US/firefox/fx/#desktop)
(the only two browsers directly available on [Travis-ci](http://about.travis-ci.org/docs/user/gui-and-headless-browsers/)).
As a consequence, if you do not change the default configuration, you need to have PhantomJS and Firefox installed and
available in the [PATH](http://en.wikipedia.org/wiki/PATH_%28variable%29) before running test commands.

If you want to change the browsers used for testing, you can use ``npm config``. For example, if you only want to test
on Chrome and Safari, you can use:

```
npm config set test-browsers "Chrome,Safari"
```

Check in the [testacular project](https://github.com/vojtajina/testacular/wiki/Browsers) the list of
supported browsers to automatically run the test suite.

### Running the test suite manually

To run the test suite, you can use:

```
npm test
```

This command:
* executes the build
* checks ``.js`` and ``.json`` files with [JSHint](http://www.jshint.com/)
* runs the test suite in node.js
* runs tests with [testacular](http://vojtajina.github.com/testacular/) in the browsers configured in the
previous section.

### Running the test suite automatically

When writing code, it is useful to be notified as soon as a regression is introduced.

```
npm run-script testacular
```

When running the above command, the configured browsers are started and then ``grunt`` enters in a waiting mode during
which it watches for any file changed on the file system in the directory of ``noder``. When a file is changed:
* ``.js`` and ``.json`` files are reformatted
* the build is executed
* ``.js`` and ``.json`` files are checked with [JSHint](http://www.jshint.com/)
* tests are run with [testacular](http://vojtajina.github.com/testacular/) in the configured browsers.

### Code coverage

To get the code coverage report, you can use the following command:

```
npm run-script coverage
```

This executes tests with [testacular](http://vojtajina.github.com/testacular/) in the configured browsers and creates
a report for each browser in the ``coverage`` directory.
