title: Getting started
page: getstarted
---
# Getting started

Noder supports CommonJS Modules/1.0, as specified [here](http://www.commonjs.org/specs/modules/1.0/).
This basically allows a module to export its API through exports and to use the exported API from other modules through
a synchronous require function. For information about how to write a module, you can refer to the
[documentation of node.js](http://nodejs.org/docs/latest/api/modules.html).

This page describes how to use Noder to load modules in a web browser.

## Including noderJS in the page

### Script tag

First of all you need to load noderJS inside your page. The simplest way is to use a direct reference to <code>noder-js.ariatemplates.com</code>,
as shown below:

```html
<script type="text/javascript" src="http://noder-js.ariatemplates.com/dist/v%NODERJSVERSION%/noder.dev.js"></script>
```

Note that [`noder.dev.js`](http://noder-js.ariatemplates.com/dist/v%NODERJSVERSION%/noder.dev.js) is a development version of
noderJS. It is easy to use when debugging, as the code is not minified and the file includes error messages. However, it is not
recommended to be used in a production environment, as it is quite big so it is slow to download.

Alternatively, you can use one of the following files:

* [`noder.dev.min.js`](http://noder-js.ariatemplates.com/dist/v%NODERJSVERSION%/noder.dev.min.js): minified version of `noder.dev.js`
(with error messages)
* [`noder.js`](http://noder-js.ariatemplates.com/dist/v%NODERJSVERSION%/noder.js): not minified, without error messages.
In case an error occurs, the following extra files are automatically downloaded to display a readable error message:
[`noderError/error.js`](http://noder-js.ariatemplates.com/dist/v%NODERJSVERSION%/noderError/error.js),
[`noderError/evalError.js`](http://noder-js.ariatemplates.com/dist/v%NODERJSVERSION%/noderError/evalError.js),
and [`noderError/acorn.js`](http://noder-js.ariatemplates.com/dist/v%NODERJSVERSION%/noderError/acorn.js).
* [`noder.min.js`](http://noder-js.ariatemplates.com/dist/v%NODERJSVERSION%/noder.min.js): minified version of `noder.js` (without error messages).
This is the recommended version to use on a production environment, unless you want to create your own custom packaging of noderJS,
as described [here](packaging.md).

### Downloading noderJS

You can use noderJS directly from <code>noder-js.ariatemplates.com</code>. Alternatively, if you want to work with noderJS offline,
or if you want to host it on your own server, you can get the full set of files either as a downloadable zip file or through the
npm repository.

#### ZIP file

<a class="btn btn-lg btn-white" href="https://github.com/ariatemplates/noder-js/releases/download/v%NODERJSVERSION%/noder-browser.zip" target="_blank">
<i class="fa fa-download"></i> Download zip (%NODERJSVERSION%)
</a>

#### NPM repository

To install noderJS through [npm](https://www.npmjs.org/), you can use the following command:

```
npm install noder-js@%NODERJSVERSION%
```

This will install client-side files in `node_modules/noder-js/dist/browser`, for example: `node_modules/noder-js/dist/browser/noder.dev.js`.

## Loading your first module

When the document is ready, noderJS reads all the script tags whose type attribute is `application/x-noder`
(this is [configurable](configuration.md)) and considers them as modules to be executed.

For example:

```html
<script type="text/javascript" src="http://noder-js.ariatemplates.com/dist/%NODERJSVERSION%/noder.dev.js"></script>
<script type="application/x-noder">
    // This is executed as a module.
    require('lib/myMainModule').start('myParam1', document.getElementById('myItem'));
</script>
```

It is also possible to both load noderJS and a specific module with a single line:

```html
<!-- The following script tag loads noderJS and then loads lib/myMainModule -->
<script type="text/javascript" src="http://noder-js.ariatemplates.com/dist/%NODERJSVERSION%/noder.dev.js?lib/myMainModule"></script>
```

A module loaded this way is considered the main module, available through ``require.main`` (as it is done in Node.js), so
a module can check if it is the main module with: ``module === require.main``.

A configuration object can be specified inside the script tag to change the behavior of noderJS
(check the [configuration options](configuration.md) for more details about available parameters):

```html
<script type="text/javascript" src="http://noder-js.ariatemplates.com/dist/v%NODERJSVERSION%/noder.dev.js">
{
    varName : 'myNoder' // Name of the global variable exposed by noder, the default is "noder"
}
</script>
```

You can find below a small hello world example (using [Plunker](http://plnkr.co/)) that shows how to load a module.
You can click on the "Code" button to see the different files and on the "Preview" button to run the example.
You can also click on the "Edit" button to open an online editor. This will allow you to change the files and
try all the [features](api.md) of noderJS.

<div class="snippet"><pre><iframe src="http://embed.plnkr.co/UNTr3J/index.html" style="height:350px;"></iframe></pre></div>
