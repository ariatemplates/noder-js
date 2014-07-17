title: API
page: api
---
# noderJS API

This page details the public API exposed by noderJS.

## Module variables

Inside a module loaded with noderJS, the following variables are automatically available.
They are compatible with the corresponding variables available from a module loaded
in [Node.js](http://nodejs.org/api/globals.html):

* [global](http://nodejs.org/api/globals.html#globals_global)
* [require.resolve](http://nodejs.org/api/globals.html#globals_require_resolve)
* [require.cache](http://nodejs.org/api/globals.html#globals_require_cache)
* [require.main](http://nodejs.org/api/globals.html#globals_require)
* [exports and module.exports](http://nodejs.org/api/globals.html#globals_exports)
* [module.filename](http://nodejs.org/api/modules.html#modules_module_filename) and [module.id](http://nodejs.org/api/modules.html#modules_module_id)
* [module.loaded](http://nodejs.org/api/modules.html#modules_module_loaded)
* [module.require](http://nodejs.org/api/modules.html#modules_module_require_id)
* [__filename](http://nodejs.org/api/globals.html#globals_filename)
* [__dirname](http://nodejs.org/api/globals.html#globals_dirname)

## noder global variable

noderJS creates a global variable called `noder` (its name is [configurable](configuration.md)).
This variable corresponds to the root module that is automatically created by noderJS.
All the properties usually available on the `module` variable in a module (and listed in the previous section)
are also available on the `noder` global variable. Moreover, the following shortcuts are also available for
convenience (most of them are documented later in this page):

* `noder.asyncRequire = noder.require("noder-js/asyncRequire")`
* `noder.define = noder.require("noder-js/currentContext").define`
* `noder.execute = noder.require("noder-js/currentContext").jsModuleExecute`
* `noder.createContext = noder.require("noder-js/context").createContext`
* `noder.updatePackagesMap`: the map provided as a parameter will be recursively merged with the existing one (it is normally provided in the [configuration](configuration.html)). This method can be useful when you want noder to be able to load modules from packages. For more information on packaging, see [here](packaging.html).

The `noder` global variable is especially intended to be used from any JavaScript code in the page that is not
loaded through noderJS (and thus does not have access to its own `module` and `require` variables). Unless there
is a good reason, it should not be used inside a module loaded through noderJS, as, for better compatibility with
CommonJS standards, it is better to use the local `module` and `require` variables.

Note that the `noder` global variable is especially useful for debugging: you can inspect the noderJS cache
and access all modules through `noder.require.cache`.

## Asynchronous module loading

#### Usage

In addition to the basic synchronous standard version of require (which is equivalent to a static dependency), noderJS
provides a promises-based `asyncRequire` method to load a module asynchronously:

**asyncRequire (modulePath1, modulePath2...) : Promise**

`asyncRequire` accepts any number of module paths as parameters and returns a promise giving access to the array of
the `exports` objects of all requested modules.

It can be used in the following way:

```js
var asyncRequire = require('noder-js/asyncRequire');

// asyncRequire preloads and executes the modules given as parameters and returns a promise.
// As the promise result is an array, it is possible to use "spread" to get each array item
// as a different argument of the given handler function:
asyncRequire("myFirstModule", "mySecondModule").spread(function (myFirstModule, mySecondModule){
    // Do something with myFirstModule and mySecondModule
}, function (error) {
    // Do something in case of failure
});
```

#### Relative paths

If you want to use relative paths in `asyncRequire` (i.e. paths which are relative to the current module, in the same way
as it is possible with the synchronous `require`), you can either convert them to absolute paths with `require.resolve`
or you can create a local version of the `asyncRequire` method, as shown in the following two equivalent examples:

```js
var asyncRequire = require('noder-js/asyncRequire');

// Use require.resolve to convert the relative path into an absolute path:
asyncRequire(require.resolve("./myRelativeModule")).spread(function (myRelativeModule) { /* ... */ });
```

```js
// Use the create method to create a local version of the asyncRequire method which accepts relative paths:
var asyncRequire = require('noder-js/asyncRequire').create(module);

// Then relative paths can be used directly:
asyncRequire("./myRelativeModule").spread(function (myRelativeModule) { /* ... */ });
```

#### Shortcut

For convenience, the `asyncRequire` method is also available on the `noder` global variable, so that it is easy to load
some modules asynchronously, even from code which was not loaded through noderJS:

```js
noder.asyncRequire("myModule").spread(function (myModule){ /* ... */ }, function (error) { /* ... */ });
```

## Loader plugins

Before a module can be executed in noderJS, it has to be preloaded. The preload process consists in downloading the
module file, parsing it to detect its static dependencies, and preloading those dependencies. The preload process is usually
asynchronous, as it usually involves one or more XHR requests (which, by default, are configured to be asynchronous).

noderJS provides the ability to add custom actions to the preload process, by implementing a loader plugin.
This is especially useful to preload additional dependencies which cannot be automatically detected because they are
not static. These include, for example, language-dependent resources or browser-dependent code.

For example, let's consider our `sample.js` module which depends on a language-dependent resource.
The code could look like the following example:

```js
var language = require("resourcesManager").language;
var myResources = require("./myRes_"+language);
// ...
```

When parsing this file, noderJS will find `resourcesManager` as a static dependency, but will be unable know the other file to preload
as it depends on the `language` variable, whose value is unknown at the time the file is parsed (as it is not executed yet).
As a result, when later executing this file, the second require will probably fail because the dependency will not have been preloaded
and it will most likely not be possible to preload it synchronously (if XHR requests are configured to be asynchronous).

To solve this kind of issues, or to execute any other custom actions asynchronously, support for loader plugins was implemented.
The parser detects the pattern `require("loaderPluginPath/$loaderPluginName").methodName(arg1, arg2...)` in the file to be preloaded,
and executes the loader plugin module at preloading time. It calls the `$preload` method on the `methodName` property of the object
exported by the loader plugin and executes it with the parsed arguments (which must be either string literals or the special `__dirname`,
`__filename` and `module` variable, or `null`). The `$preload` method can return a promise. If it is the case, the preload process will
wait for the promise to be fulfilled before marking the module as preloaded.

Now our `sample.js` module depending on a language-dependent resource can be re-written in the following way:

```js
var myResources = require("$resourcesLoader").getResource(__dirname, "./myRes");
// ...
```

The loader plugin, called `$resourcesLoader.js` could look like this:

```js
var asyncRequire = require("noder-js/asyncRequire");
var language = require("resourcesManager").language;
exports.getResource = function(directory, resource) {
   // this method is executed when sample.js is executed
   // it is synchronous
   return require(directory + "/" + resource);
};
exports.getResource.$preload = function(directory, resource) {
   // this method is automatically executed when sample.js is preloaded
   // it can be asynchronous by returning a promise
   return asyncRequire(directory + "/" + resource);
};
```

## Promises library

<a href="http://promisesaplus.com/">
<img src="http://promisesaplus.com/assets/logo-small.png" alt="Promises/A+ logo" title="Promises/A+ 1.1.1 compliant" align="right"
 style="margin-left:10px;" />
</a>

noderJS heavily relies on promises. It includes a lightweight promise library which is compliant with the
[Promises/A+ specifications](http://promisesaplus.com) version 1.1.1.

The integrated promise library can be accessed with:

```js
var Promise = require("noder-js/promise");
```

### Promise constructor

**new Promise (factoryFunction : function(resolve, reject)) : Promise**

Creates a new promise. The given `factoryFunction` gets a reference to the `resolve` and `reject` methods which
allow to resolve or reject the promise. If the `factoryFunction` raises an exception before calling `resolve`
or `reject`, the promise is rejected with the exception as the reason.

Here is a sample implementing a promise-based version of `setTimeout`:

```js
var Promise = require("noder-js/promise");

var setTimeoutWithPromise = function (delay) {
   return new Promise(function(resolve, reject) {
      setTimeout(function() {
         resolve(7);
      }, delay);
   });
};

console.log("Before calling setTimeoutWithPromise");
setTimeoutWithPromise(1000).then(function (result) {
   console.log("In the callback. The result is: " + result)
});
console.log("After calling setTimeoutWithPromise");

// The console should contain:
// Before calling setTimeoutWithPromise
// After calling setTimeoutWithPromise
// In the callback. The result is: 7
```

Using the Promise constructor is the recommended way to create a promise. Alternatively, it is also possible
to use the `Promise.defer` method below.

### Promise.defer()

**Promise.defer () : Defer**

Creates a new defer. A defer is an object with 3 properties:

```js
{
   promise: promise, /* Promise instance object (with the 'then' method) */
   resolve: resolve, /* Function to resolve the promise, with the specified value. */
   reject: reject /* Function to reject the promise, with the specified reason. */
}
```

Here is a sample re-implementing the `setTimeoutWithPromise` function from the previous section,
but using `Promise.defer()` instead of the promise constructor.

```js
var Promise = require("noder-js/promise");

var setTimeoutWithPromise = function (delay) {
   var defer = Promise.defer();
   setTimeout(function() {
      defer.resolve(7);
   }, delay);
   return defer.promise;
};
```

### Promise.resolve()

**Promise.resolve(valueOrPromise) : Promise**

If `valueOrPromise` is a noder-js promise, `Promise.resolve` returns it directly.

If `valueOrPromise` is an object or a function with a `thenSync` or `then`  method, it is considered as a promise and
`Promise.resolve` returns an equivalent noderJS promise.

Otherwise, `Promise.resolve` returns an already fulfilled promise, whose fulfillment value is `valueOrPromise`.

```js
var Promise = require("noder-js/promise");

var promiseInstance = Promise.resolve(7);
promiseInstance.then(function (value) { /* here, value == 7 */ });
Promise.resolve(promiseInstance) // this call returns promiseInstance
Promise.resolve({
   then: function (resolve, reject) {
      resolve(7);
   }
}).then(function(value) { /* here, value == 7 */ });

```

### Promise.reject()

**Promise.reject(reason) : Promise**

`Promise.reject` returns a rejected promise with the given reason.

```js
var Promise = require("noder-js/promise");

Promise.reject("error").catch(function (reason) { /* here, reason == "error" */ });
```

### Promise.done

**Promise.done : Promise**

`Promise.done` is a reference to an already resolved promise, whose fulfillment value is `undefined`.

It is defined by:

```js
Promise.done = Promise.resolve();
```

It can be used instead of `Promise.resolve(undefined)` to avoid creating a new promise instance.

### Promise.all() and Promise.allSettled()

**Promise.all (promiseOrValueArray : Array) : Promise**

**Promise.allSettled (promiseOrValueArray : Array) : Promise**

`Promise.all` and `Promise.allSettled` return a promise that is fulfilled when all the given promises are fulfilled.

`Promise.all` is the fail-fast version of `Promise.allSettled`:
* the promise returned by `Promise.allSettled` is rejected only when all promises are either fulfilled or rejected.
* the promise returned by `Promise.all` is rejected as soon as any promise is rejected, without waiting for other
promises to either be fulfilled or rejected.

Apart from that timing difference, `Promise.all` and `Promise.allSettled` are otherwise fully equivalent.

Here is an example showing how to use `Promise.all`:

```js
var Promise = require("noder-js/promise");
var asyncRequire = require("noder-js/asyncRequire");

Promise.all(["simple value", asyncRequire("myModule1", "myModule2")]).spread(function (simpleValue, myModules) {
   // here:
   // simpleValue == "simple value"
   // myModules is an array containing the exports objects of myModule1 and myModule2
}, function (error) {
   // this function is called in case there is an error while loading myModule1 or myModule2
});
```

### promiseInstance.then() and its shortcuts

**promiseInstance.then(onFulfilled : function (value), onRejected : function (reason)) : Promise**

`promiseInstance.then` adds a fulfillment and a rejection handler to the promise, and returns a new promise
resolving to the return value of the called handler.

If `onFulfilled` is null (or not a function), and `promiseInstance` is fulfilled, the returned promise is
fulfilled with the same fulfillment value.

If `onRejected` is null (or not a function), and `promiseInstance` is rejected, the returned promise is rejected
with the same reason.

If both `onFulfilled` and `onRejected` are null (or not functions), `promiseInstance` itself is returned.

The following shortcuts for `promiseInstance.then` are available:

**promiseInstance.catch(onRejected : function (reason)) : Promise**

```js
promiseInstance.catch(onRejected);
// is equivalent to:
promiseInstance.then(null, onRejected);
```

**promiseInstance.finally(handler : function (value)) : Promise**

```js
promiseInstance.finally(handler);
// is equivalent to:
promiseInstance.then(handler, handler);
```

**promiseInstance.spread(onFulfilled : function (value1, value2 ...), onRejected : function (reason)) : Promise**

`promiseInstance.spread` can be used when the fulfillment value is expected to be an array.

```js
promiseInstance.spread(onFulfilled, onRejected);
// is equivalent to:
promiseInstance.then(function(array) {
  // each item of the array is passed as a different argument to onFulfilled:
  return onFulfilled.apply(null, array);
}, onRejected);
```

**promiseInstance.done(onFulfilled : function (value), onRejected : function (reason))**

The `done` method is equivalent to `then` except that it does not return a new promise, and it reports any error by throwing it
asynchronously.
It is often used without any argument to end a promises chain so that any unhandled error in the chain is properly
reported instead of being silently ignored.

For example, with the folling code, if an error occurs when loading `myModule`, or in the function which uses `myModule`,
the error is silently ignored:

```js
var asyncRequire = require("noder-js/asyncRequire");

asyncRequire("myModule").spread(function (myModule) {
  // do something with myModule
}); // without .done(), errors in this promises chain are silently ignored
```

Adding `.done()` at the end of the promises chain makes sure any unhandled error happening in the promises chain is properly reported:

```js
var asyncRequire = require("noder-js/asyncRequire");

asyncRequire("myModule").spread(function (myModule) {
  // do something with myModule
}).done(); // with .done(), errors are properly reported
```

### promiseInstance.thenSync() and its shortcuts

Following the [Promises/A+ specifications](http://promises-aplus.github.io/promises-spec/), the `promiseInstance.then` method never
calls its handlers synchronously. The same applies to the associated `spread`, `catch`, `finally` and `done` shortcuts.

However, in some cases, it can be useful to avoid code duplication by handling both the asynchronous and the synchronous cases with
the same code. For example, noderJS itself can be configured to use either synchronous or asynchronous XHR requests and uses the same
code to handle both cases, without adding asynchronism uselessly.

For this to be possible, noderJS provides the `thenSync`, `spreadSync`, `catchSync`, `finallySync` and `doneSync` methods which behave
exactly as their `then`, `spread`, `catch`, `finally` and `done` counterparts, except that, in case the promise is already fulfilled or
rejected at the time the `xSync` method is called, the corresponding handler is called synchronously.

Here is an example which shows the difference between `then` and `thenSync:`

```js
var thenValue, thenSyncValue;
var Promise = require("noder-js/promise");
var myPromise = Promise.resolve(7);

// myPromise is already fulfilled
myPromise.then(function (value) { thenValue = value; });
myPromise.thenSync(function (value) { thenSyncValue = value; });
console.log("thenValue = " + thenValue);
console.log("thenSyncValue = " + thenSyncValue);

// The result in the console is:
// thenValue = undefined
// thenSyncValue = 7
```

Note that the behavior of `thenSync` only differs from the one of `then` if it is called on an already fulfilled or rejected promise.
In the following sample, both `then` and `thenSync` behave in the same way because the promise is still pending when `then` and `thenSync` are called:

```js
var thenValue, thenSyncValue;
var Promise = require("noder-js/promise");
var defer = Promise.defer();
var myPromise = defer.promise;

// myPromise is not yet fulfilled
myPromise.then(function (value) { thenValue = value; });
myPromise.thenSync(function (value) { thenSyncValue = value; });

defer.resolve(7); // now it is fulfilled, but the handlers will be called asynchronously
console.log("thenValue = " + thenValue);
console.log("thenSyncValue = " + thenSyncValue);

// The result in the console is:
// thenValue = undefined
// thenSyncValue = undefined
```

Note that `thenSync` is not (yet?) standard. There was a [request](https://github.com/promises-aplus/promises-spec/issues/169) to better integrate
Promises/A+ specifications with synchronous code, but it was unfortunately rejected.

### promiseInstance.isFulfilled() and promiseInstance.isRejected()

**promiseInstance.isFulfilled() : Boolean**

Returns `true` if `promiseInstance` is fulfilled, and `false` otherwise.

**promiseInstance.isRejected() : Boolean**

Returns `true` if `promiseInstance` is rejected, and `false` otherwise.

If both `promiseInstance.isFulfilled()` and `promiseInstance.isRejected()` return `false`, the promise is still pending.
`promiseInstance.isFulfilled()` and `promiseInstance.isRejected()` never both return `true` for the same promise instance.

```js
var Promise = require("noder-js/promise");
Promise.resolve(7).isFulfilled() // returns true
Promise.resolve(7).isRejected() // returns false
Promise.reject(7).isFulfilled() // returns false
Promise.reject(7).isRejected() // returns true
Promise.defer().promise.isFulfilled() // returns false
Promise.defer().promise.isRejected() // returns false
```

### promiseInstance.result()

**promiseInstance.result()**

If `promiseInstance` is fulfilled, `promiseInstance.result()` returns the fulfillment value.

If `promiseInstance` is rejected, `promiseInstance.result()` returns the rejection reason.

Otherwise (i.e. `promiseInstance` is still pending), `promiseInstance.result()` returns `undefined`.

```js
var Promise = require("noder-js/promise");
Promise.resolve(7).result() // returns 7
Promise.reject(7).result() // returns 7
Promise.defer().promise.result() // returns undefined
```

## Request utility

noderJS contains a small promises-based utility to make network requests:

```js
var request = require("noder-js/request");
```

It is a simple wrapper around [XMLHttpRequest](http://www.w3.org/TR/XMLHttpRequest) that hides some of the
differences between browsers and makes it easy to request files.

**request (url: String, options: Object) : Promise**

This method sends a request to the server for the specified url and returns a promise.

The options object is optional. Here is the list of accepted options:

```js
options : {
   headers : {
      // Headers to be included in the request, for example:
      "Content-Type": "text/plain"
   },
   data : "My Request is...", // String - Body of the request
   sync : false, // Boolean - Specifies if the request is synchronous or not (default: false)
   method : "POST" // String - Type of request (default: "GET")
}
```

Here is an example, which posts a json object to the server, and parses the response as json:

```js
var request = require("noder-js/request");

request("/api/", {
   method: "POST",
   headers: {
     "Content-Type": "application/json"
   },
   data: JSON.stringify(myJsonObjectToSend)
}).then(function (xhr) {
   // Success callback
   // Parses the response as JSON:
   var responseText = xhr.responseText;
   var responseJson = JSON.parse(responseText);
   // ...
}).catch(function(error) {
   // error callback handling cases when either the request fails or parsing the response JSON fails
   // ...
});
```

## Context

A noderJS context is automatically created when noderJS is loaded. noderJS also provides an API to create new contexts.
Each noderJS context has its own [configuration](configuration.md) and its own cache of modules.

Inside the same context, when the same module is required twice, the corresponding module is in fact loaded only once and the
reference is shared.

However, if the same module is required from two different contexts, two different instances of the module will be loaded and
will be independent from one another.

It can be useful to create a new context when testing a module. The tested module can be put in a mocked environment by exposing
mocks in the new context, so that the tested module will access mocks instead of the original modules when calling the usual
`require` method.

### Getting a context instance

#### New context

Here is how to create a new context:

```js
var Context = require("noder-js/context");
var contextInstance = new Context({
   /* context configuration */
});
```

The context configuration object is described in the [configuration page](configuration.md).

#### Current context

Here is how to get a reference to the current context:

```js
var contextInstance = require("noder-js/currentContext");
```

### Context instance methods

**contextInstance.expose(path: String, object: Object)**

Exposes the given object at the given path. This means that, the next time a module with that path
has to be loaded in the context, the usual loading method will be bypassed and the given object
will be used as the export object.

Note that this method does not unload any already loaded module at the given path. If a module with the
given path is already loaded when this method is called, it is still accessible until it is deleted
from the cache.

For example:

```js
var myObject = {};
contextInstance.expose("myModule.js", myObject);

var myModule = contextInstance.require("myModule");
delete contextInstance.require.cache["myModule.js"];
var myReloadedModule = contextInstance.require("myModule");

// Here, we always have:
// myObject === myReloadedModule

// We can also have:
// myObject === myModule
// but only if myModule.js was not loaded before the call to the expose method.
```

### Context instance properties

**contextInstance.config**

A reference to the configuration of the context.

**contextInstance.cache**

The same object as the one available in `require.cache` from modules loaded from this context.

**contextInstance.builtinModules**

An object containing all built-in modules (also including modules exposed through the `expose` method).

**contextInstance.rootModule**

A special module created when the context is created.

## asyncCall

noder-js exposes an `asyncCall` module with some utility functions to call functions asynchronously or synchronously.

```js
var asyncCall = require("noder-js/asyncCall");
```

**asyncCall.nextTick(f : function())**

Registers a function to be executed asynchronously.
The function is called with no scope and no argument.
Functions are executed in the same order as they are registered.

The implementation of this function in the browser version of noderJS relies on `setTimeout`.
To improve performance, multiple consecutive calls to `asyncCall.nextTick` in the same event loop turn lead to at most one call to `setTimeout`.
Calling `async.nextTick` from a function called with `asyncCall.nextTick` simply adds the new function to the list of functions to be executed,
without any call to `setTimeout`, and the function is executed at the end of the same event loop turn.

```js
var asyncCall = require("noder-js/asyncCall");
var myCounter = 0;
asyncCall.nextTick(function () {
  myCounter++;
  console.log("First function: " + myCounter);
});
asyncCall.nextTick(function () {
  myCounter++;
  console.log("Second function: " + myCounter);
});
console.log("Main: " + myCounter);

// The console will have the following output:
// Main: 0
// First function: 1
// Second function: 2
```

**asyncCall.syncCall(f : function())**

Executes the given function synchronously. In case an error happens in the callback, it is thrown again asynchronously, so that the caller
of `asyncCall.syncCall` is not affected.

This function has the same signature as `asyncCall.nextTick`. This way, it is possible to parameterize an algorithm with a reference to a callback
executor, which can be set to be either `asyncCall.nextTick` to call callbacks asynchronously, or `asyncCall.syncCall` to call callbacks
synchronously. This is done internally for the implementation of the `then` and `thenSync` promise methods.

**asyncCall.nextTickCalls(arrayOfFunctions : Array)**

Registers an array of functions to be executed later asynchronously. The functions are called in the order in which they appear in the array.

Note that this function modifies the array: the first item of the array is removed, then the corresponding function is executed, then
the new first item of the array is removed, ... until there is no remaining item in the array.
Also note that, if the array is changed outside of `asyncCall.nextTickCalls` before the execution of all array items is finished, it has
an impact on the functions which are actually executed.

**asyncCall.syncCalls(arrayOfFunctions : Array)**

Synchronous version of `asyncCall.nextTickCalls`. Executes each function in the array, in order, synchronously.

**asyncCall.syncTick()**

Executes synchronously all the functions currently planned to be executed asynchronously (and registered with `asyncCall.nextTick`).
Note that this method should __never__ be called from application code.
However, it can be useful to use it from tests to execute asynchronous code synchronously and improve performance for tests execution.

```js
var asyncCall = require("noder-js/asyncCall");
var methodCalled = false;
asyncCall.nextTick(function () {
   methodCalled = true;
});
// here, methodCalled = false
asyncCall.syncTick(); // this calls ALL the functions previously registered with asyncCall.nextTick and not yet executed
// here, methodCalled = true
```

## findRequires parser

noderJS includes a small parser for JavaScript code which extracts calls to the `require` method. It is exposed as `noder-js/findRequires`:

```js
var findRequires = require("noder-js/findRequires");
```

**findRequires(jsCode : String, detectLoaderPlugins : Boolean)**

* `jsCode`: JavaScript code to be parsed.
* `detectLoaderPlugins`: whether to return information about loader plugins.

`findRequires` returns an array. Each item in the array can be:
* a string, which is the string literal used in a call to require.
* (only if `detectLoaderPlugins` is `true`) an object with the `module` (string), `method` (string) and `args` (array) properties, corresponding
to a call to a loader plugin.
Note that for each loader plugin detected, a string entry is also present in the array in addition to the object. Each item in the args properties
is either a string (corresponding to a string literal argument), or an array with a single string element (corresponding to a non-quoted argument
like `module` or `null`).

Each string corresponds to a call to require in the source code.

```js
var findRequires = require("noder-js/findRequires");

findRequires("var myModule = require('myModule')"); // returns ["myModule"]
findRequires("var myModule = require( /* comment1 */ 'myModule' /* 'comment2' */ )"); // returns ["myModule"]

// The following 3 calls all return [] (an empty array)
findRequires("var myModule = require('my' + 'Module')"); // expressions are not included
findRequires("var myModule = module.require('myModule')"); // calls to module.require are not included
findRequires("var myString = \"require('myModule')\""); // the content of string literals is not included

// Loader plugins:
findRequires("require('$loaderPlugin').myMethod('arg1', module)"); // returns ['$loaderPlugin']
findRequires("require('$loaderPlugin').myMethod('arg1', module)", true);
// The previous line returns:
[ '$loaderPlugin',
  { module: '$loaderPlugin',
    method: 'myMethod',
    args: [ 'arg1', ["module"] ] } ]
```
