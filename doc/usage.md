[Documentation index](index.md)

# Noder usage

Noder supports CommonJS Modules/1.0, as specified [here](http://www.commonjs.org/specs/modules/1.0/).
This basically allows a module to export its API through exports and to use the exported API from other modules through
a synchronous require function. For information about how to write a module, you can refer to the
[documentation of node.js](http://nodejs.org/docs/latest/api/modules.html).

This page describes how to use Noder to load modules in a web browser.

## Including Noder in the page

Noder can be loaded in the page through a script tag:

```html
<script type="text/javascript" src="noder.js"></script>
```

This creates a ``noder`` global variable which is a reference to a special module which can then be used everywhere just
like the module variable in a module (note that the name of the variable is [configurable](configuration.md)).

When noder starts, it reads all the script tags whose type attribute is ``noder`` (this is configurable) and considers
them as modules to be executed. For example:

```html
<script type="text/javascript" src="noder.js"></script>
<script type="noder">
    // This is executed as a module.
    require('lib/myMainModule').start('myParam1', document.getElementById('myItem'));
</script>
```

It is also possible to both load Noder and a specific module with a single line:

```html
<!-- The following script tag loads Noder and then loads lib/myMainModule -->
<script type="text/javascript" src="noder.js?lib/myMainModule"></script>
```

A module loaded this way is considered the main module, available through ``require.main`` (as it is done in Node.js), so
a module can check if it is the main module with: ``module === require.main``.

A configuration object can be specified inside the script tag to change the behavior of Noder
(check the [configuration options](configuration.md) for more details about available parameters):

```html
<script type="text/javascript" src="noder.js">
{
    varName : 'myNoder' // Name of the global variable exposed by noder, the default is "noder"
}
</script>
```

## Compatibility with node.js

To provide compatibility with the Node.js implementation of CommonJS, the following global objects are available in modules
(check [here](http://nodejs.org/api/globals.html) for Node documentation):

* global
* require.resolve
* require.cache
* require.main
* exports and module.exports (check here for module properties)
* module.filename
* module.id (most of the time equal to module.filename)
* module.loaded
* module.require
* module.parent
* module.children
* __filename
* __dirname


## Asynchronous module loading

In addition to the basic synchronous version of require (which is equivalent to a static dependency), Noder supports
a built-in asynchronous promise-based version.

* The ``asyncRequire`` method is available on the global ``noder`` variable, so that it is easy to load
one (or more) module(s) asynchronously from any Javascript file (even if this file is not using the module format):

```js
// preloads and executes lib/myModule:
noder.asyncRequire('lib/myModule').then(function(myModule){
    // myModule can be used here
});
```

* From a module, it is better to use ``require('noder-js/asyncRequire')`` as shown in the following sample.
In that case, the path of the current module is taken into account when resolving the module name (as when using
the synchronous ``require`` method).

```js
var asyncRequire = require('noder-js/asyncRequire').create(module); // Create an asyncRequire function for this module.

// asyncRequire preloads and executes the modules given as parameters and returns a promise.
asyncRequire("myFirstModule", "./mySecondModule").then(function (myFirstModule, mySecondModule){
    // Do something with myFirstModule and mySecondModule
}, function (error) {
    // Do something in case of failure
});
```
