# Noder

[![Build Status](https://secure.travis-ci.org/ariatemplates/noder-js.png?branch=master)](https://travis-ci.org/ariatemplates/noder-js)

***Note that Noder is still under construction.***

## Features

Noder is a JavaScript loader for web browsers with the following features:

* It is compatible with [CommonJS Modules/1.0 specifications](http://www.commonjs.org/specs/modules/1.0/) and mostly compatible with the [node.js](http://nodejs.org) module system.
This allows to easily import dependencies with ``var myModule = require("myModule");``

* It is (and will stay) small: &lt; 6kB minified and gzipped.

* It supports both packaged and unpackaged modules.

* It supports both asynchronous and synchronous HTTP requests (requests are asynchronous by default to avoid blocking the browser).

* Modules can be loaded on demand (both in packaged and unpackaged mode).

* It is tested on:
	* Firefox (latest)
	* Chrome 30
	* Safari 6
	* Internet Explorer 7, 8, 9, 10 and 11
	* Android 4.0
	* PhantomJS

* It is very likely to be compatible with other browsers as well.

* Even if it is intended to be run on web browsers, a node.js version of Noder is also available.

* It has many configuration options (check the [documentation](http://noder-js.ariatemplates.com/)).

## Why using Noder ?

As [node.js](http://nodejs.org) is increasingly being used to implement web servers and command line tools,
it is important to be able to reuse some libraries both in a browser and in [node.js](http://nodejs.org).

To achieve this goal, there are several approaches:

* Some projects, such as [Browserify](https://github.com/substack/node-browserify) or [Webmake](https://github.com/medikoo/modules-webmake),
provide a tool to package in a single file a set of [node.js](http://nodejs.org) modules which can then be used from the browser.
This is convenient for small applications, but for bigger ones, having a loader, instead of only a packager, allows to improve the
user experience by loading at the beginning only what is strictly needed (thus reducing the time to display the first page)
and then loading later additional modules when they are required. A packager is still useful, though, to group files together instead of
doing a different request for each module.

* Other projects, such as [Requirejs](http://requirejs.org/) or [Curl](https://github.com/cujojs/curl/wiki), provide loaders compatible with
the [Asynchronous Module Definition API (AMD)](https://github.com/amdjs/amdjs-api/wiki/AMD), but, as a consequence, they are not directly compatible with
the [node.js](http://nodejs.org) module system. Then, for a library written as a set of AMD modules to run on [node.js](http://nodejs.org), it must be loaded through a specific
loader (such as [r.js](https://github.com/jrburke/r.js)) running on top of the [node.js](http://nodejs.org) module system, which makes it more difficult to
use in a usual [node.js](http://nodejs.org) application. Some people suggested to [add AMD support to node.js](https://groups.google.com/forum/?fromgroups=#!msg/nodejs-dev/yK7i56thS4Q/tqvkYp14t5YJ),
but it was refused as it increases too much the complexity of the loader.

* The approach used by Noder is to provide a loader for browsers to be able to run unmodified [node.js](http://nodejs.org) modules. The fact that Noder is compatible with
the synchronous (and simple to use) ``require`` syntax does not mean it is using synchronous requests though (even if a synchronous mode is also supported). By default,
all requests are done asynchronously through [XHR](http://www.w3.org/TR/XMLHttpRequest1/) but Noder waits until all transitive static dependencies of a module are loaded
before executing the code of the module.
	* When a non-packaged module is requested, dependencies are determined by quickly parsing the content of the module with regular expressions, extracting all calls to the
	``require`` function. Note that non-packaged mode is normally used only during development.
	* When a packaged module is requested, the package format (very similar to the one used by [Requirejs](http://requirejs.org/))
	contains for each module the pre-computed set of dependencies, so that there is no need at run-time to parse the module content to extract calls to the ``require`` function.

## Getting started

* Download the `noder-browser.zip` file from the latest release of Noder in the [releases section](https://github.com/ariatemplates/noder-js/releases).

* Extract it in the folder of your choice. It contains the following files and directories:
	* ``noder.min.js``: main entry point of Noder
	* ``noder.js``: unminified version of ``noder.min.js``, can be used instead of ``noder.min.js`` for debugging.
	* ``noderError``: this directory contains files which are automatically downloaded when an error occurs, so that more details can be displayed about it.

* Add the following line in your HTML page, replacing ``firstModule`` with the name of the first module to load and execute:

```html
<script type="text/javascript" src="noder.min.js?firstModule"></script>
```

By default, the module is looked for in the same directory as the HTML page, but it is possible to change it through configuration options.
When the page is loaded, ``firstModule.js`` will automatically be loaded and executed.

* Noder has many more features. Please check the [documentation](http://noder-js.ariatemplates.com/).
