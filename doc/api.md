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
* [module.parent](http://nodejs.org/api/modules.html#modules_module_parent)
* [module.children](http://nodejs.org/api/modules.html#modules_module_children)
* [__filename](http://nodejs.org/api/globals.html#globals_filename)
* [__dirname](http://nodejs.org/api/globals.html#globals_dirname)

## noder global variable

noderJS creates a global variable called `noder` (its name is [configurable](configuration.md)).
This variable corresponds to the root module that is automatically created by noderJS.
All the properties usually available on the `module` variable in a module (and listed in the previous section)
are also available on the `noder` global variable. Moreover, the following shortcuts are also available for
convenience (they are documented later in this page):

* `noder.asyncRequire = noder.require("noder-js/asyncRequire")`
* `noder.define = noder.require("noder-js/currentContext").define`
* `noder.execute = noder.require("noder-js/currentContext").jsModuleExecute`
* `noder.createContext = noder.require("noder-js/context").createContext`

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

`asyncRequire` accepts any number of module paths as parameters and returns a promise giving access to the `exports`
object of each requested module.

It can be used in the following way:

```js
var asyncRequire = require('noder-js/asyncRequire');

// asyncRequire preloads and executes the modules given as parameters and returns a promise.
asyncRequire("myFirstModule", "mySecondModule").then(function (myFirstModule, mySecondModule){
    // Do something with myFirstModule and mySecondModule
}, function (error) {
    // Do something in case of failure
});
```

#### Relative paths

If you want to use relative paths in `asyncRequire` (i.e. paths which are relative to the current module, in the same way
as it is possible with the synchronous `require`), you can either convert them to absolute paths with `require.resolve`
or you can create a local version of the `asyncRequire` method, as shown in the two following equivalent examples:

```js
var asyncRequire = require('noder-js/asyncRequire');

// Use require.resolve to convert the relative path into an absolute path:
asyncRequire(require.resolve("./myRelativeModule")).then(function (myRelativeModule) { /* ... */ });
```

```js
// Use the create method to create a local version of the asyncRequire method which accepts relative paths:
var asyncRequire = require('noder-js/asyncRequire').create(module);

// Then relative paths can be used directly:
asyncRequire("./myRelativeModule").then(function (myRelativeModule) { /* ... */ });
```

#### Shortcut

For convenience, the `asyncRequire` method is also available on the `noder` global variable, so that it is easy to load
some modules asynchronously, even from code which was not loaded through noderJS:

```js
noder.asyncRequire("myModule").then(function (myModule){ /* ... */ }, function (error) { /* ... */ });
```

## Promises library

noderJS heavily relies on promises. It includes a lightweight promise library which can be accessed through:

```js
var promise = require("noder-js/promise");
```

Here is a description of each property available on this object:

### promise.defer()

**promise.defer () : Defer**

Creates a new defer. A defer is an object with 3 properties:

```js
{
   promise: promise, /* Promise instance object (with the 'then' method) */
   resolve: resolve, /* Function to resolve the promise, with the specified arguments. */
   reject: reject /* Function to reject the promise, with the specified arguments. */
}
```

Here is a sample implementing a promise-based version of `setTimeout`:

```js
var promise = require("noder-js/promise");

var setTimeoutWithPromise = function (delay) {
   var defer = promise.defer();
   setTimeout(function() {
      defer.resolve(5);
   }, delay);
   return defer.promise;
};

console.log("Before calling setTimeoutWithPromise");
setTimeoutWithPromise(1000).then(function (result) {
   console.log("In the callback. The result is: " + result)
});
console.log("After calling setTimeoutWithPromise");

// The console should contain:
// Before calling setTimeoutWithPromise
// After calling setTimeoutWithPromise
// In the callback. The result is: 5
```

### promise.when() and promise.whenAll()

**promise.when (promiseOrValue1, promiseOrValue2...) : Promise**

**promise.whenAll (promiseOrValue1, promiseOrValue2...) : Promise**

Both `promise.when` and `promise.whenAll` accept any number of promises or simple values as parameters and return
a promise that is resolved when all the given promises are resolved.

`promise.when` is the fail-fast version of `promise.whenAll`:
* the promise returned by `promise.whenAll` is rejected only when all promises are either resolved or rejected.
* the promise returned by `promise.when` is rejected as soon as any promise given in the parameters is rejected, without waiting for other
promises to either be resolved or rejected.

Apart from that timing difference, `promise.when` and `promise.whenAll` are otherwise fully equivalent.

Here is an example showing how to use `promise.when`:

```js
var promise = require("noder-js/promise");
var asyncRequire = require("noder-js/asyncRequire");

promise.when("simple value", asyncRequire("myModule1"), asyncRequire("myModule2")).then(function (simpleValue, myModule1, myModule2) {
   // here:
   // simpleValue == "simple value"
   // myModule1 and myModule2 contain the resolved values of calls to asyncRequire
}, function (error) {
   // this function is called in case there is an error while loading myModule1 or myModule2
});
```

## Request utility

noderJS contains a small promises-based utility to make network requests.
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
}).then(function (responseText, xhrObject) {
   // Success callback
   // Parses the response as JSON:
   var responseJson = JSON.parse(responseText);
   // ...
}).then(null, function(error) {
   // error callback handling cases when either the request fails or parsing the response JSON fails
   // ...
});
```

**Note: this page is still in construction, the following sections are planned to be added:**

* Loader plugins
* Context

