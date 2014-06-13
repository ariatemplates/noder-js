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
`Promise.resolve` returns an equivalent noder-js promise.

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
the same code. For example, noder-js itself can be configured to use either synchronous or asynchronous XHR requests and uses the same
code to handle both cases, without adding asynchronism uselessly.

For this to be possible, noder-js provides the `thenSync`, `spreadSync`, `catchSync`, `finallySync` and `doneSync` methods which behave
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

**Note: this page is still in construction, the following sections are planned to be added:**

* Loader plugins
* Context

