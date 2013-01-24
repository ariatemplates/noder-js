/*
 * Noder 1.0.0-SNAPSHOT - 27 Nov 2012
 * https://github.com/ariatemplates/noder
 *
 * Copyright 2009-2012 Amadeus s.a.s.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*jshint undef:true*/
(function(global,callEval){
'use strict';
var internalRequire;
var internalDefine;

(function () {
    // This function defines a very small and simple internal module system for the loader itself.
    // It does not support circular dependencies and supposes all the modules are defined from the beginning.
    var modulesDef = {};
    var modules = {};

    internalRequire = function (moduleIndex) {
        var res = modules[moduleIndex];
        if (!res) {
            res = modulesDef[moduleIndex];
            if (res) {
                var module = {
                    exports: {}
                };
                res(module);
                res = modules[moduleIndex] = module.exports;
                modulesDef[moduleIndex] = null; // release some memory if possible
            } else {
                throw new Error("Missing internal module: " + moduleIndex);
            }
        }
        return res;
    };
    internalDefine = function (moduleIndex, moduleDef) {
        modulesDef[moduleIndex] = moduleDef;
    };
})();internalDefine(1 /* main */, function (module) {

var scriptConfig = internalRequire(2 /* scriptConfig */);
module.exports = internalRequire(3 /* contextBuilder */).config({
    varName: 'noder'
}).config(scriptConfig);

});

internalDefine(2 /* scriptConfig */, function (module) {

var document = global.document;
var config = {};

// When not in the loading mode, it is not reliable to use the last script to find the configuration
if (document.readyState == "loading") {
    var scripts = document.getElementsByTagName('script');
    var scriptTag = scripts[scripts.length - 1];
    if (scriptTag) {
        var src = scriptTag.src;
        // if there is no src, it cannot be the right script tag anyway
        if (src) {
            var exec = internalRequire(4 /* eval */);
            var configContent = scriptTag.innerHTML;
            if (!/^\s*$/.test(configContent)) {
                config = exec(configContent) || config;
            }

            if (!config.main) {
                var questionMark = src.indexOf('?');
                if (questionMark > -1) {
                    config.main = decodeURIComponent(src.substring(questionMark + 1));
                }
            }
        }
    }
}

module.exports = config;

});

internalDefine(3 /* contextBuilder */, function (module) {

var Context = internalRequire(5 /* context */);
var merge = internalRequire(6 /* merge */);

var ContextBuilder = function (config) {
    this._cfg = config;
};

var contextBuilderProto = ContextBuilder.prototype = {};

contextBuilderProto.config = function (config) {
    return new ContextBuilder(merge([config, this._cfg]));
};

var createContext = function (config) {
    var res = new ContextBuilder(config);
    return config ? res.create() : res;
};

contextBuilderProto.create = function () {
    var context = new Context(this._cfg);
    var rootModule = context.rootModule;
    rootModule.createContext = createContext;
    return rootModule;
};

module.exports = createContext();

});

internalDefine(4 /* eval */, function (module) {

var appendSourceUrl = true;

module.exports = function (code, fileName) {
    var res = {};
    // Using the 'arguments[1].res = ...' trick because IE does not let eval return a function
    if (fileName && appendSourceUrl) {
        code = ['/*\n * File: ', fileName, '\n */\narguments[1].res=', code, '\n//@ sourceURL=', fileName].join('');
    } else {
        code = 'arguments[1].res=' + code;
    }
    callEval(code, res); // callEval is defined outside of any closure
    return res.res;
};

});

internalDefine(5 /* context */, function (module) {

var promise = internalRequire(7 /* promise */);
var Packaging = internalRequire(8 /* packaging */);
var extractDependencies = internalRequire(9 /* extractDependencies */);
var moduleFunction = internalRequire(10 /* moduleFunction */);
var execCallModule = internalRequire(11 /* execCallModule */);
var Resolver = internalRequire(12 /* resolver */);
var execScripts = internalRequire(13 /* execScripts */);
var isArray = internalRequire(14 /* type */).isArray;
var dirname = internalRequire(15 /* path */).dirname;

var bind = function (fn, scope) {
    return function () {
        return fn.apply(scope, arguments);
    };
};

var bind1 = function (fn, scope, paramBind) {
    return function (param) {
        return fn.call(scope, paramBind, param);
    };
};

function Module(context, filename) {
    if (filename) {
        this.dirname = dirname(filename);
    } else {
        filename = '.';
        this.dirname = filename;
    }
    this.filename = filename;
    this.id = filename;
    this.require = bind1(context.require, context, this);
    this.require.resolve = bind1(context.resolve, context, this);
    this.require.cache = context.cache;
    this.parent = null;
    this.children = [];
}

var moduleProto = Module.prototype = {};
moduleProto.preloading = false;
moduleProto.preloaded = false;
moduleProto.loadingDefinition = false;
moduleProto.definition = null;
moduleProto.executing = false;
moduleProto.loaded = false;

module.exports = Module;

var createAsyncRequire = function (context) {
    return function (module) {
        module.exports = {
            create: function (module) {
                return function (id) {
                    return context.asyncRequire(module, id);
                };
            }
        };
    };
};

var start = function (context) {
    var config = context.config;
    var actions = promise.done;

    if (!config.hasOwnProperty('scriptsType')) {
        config.scriptsType = config.varName;
    }
    var scriptsType = config.scriptsType;
    if (scriptsType) {
        actions = actions.then(function () {
            return execScripts(context, scriptsType);
        });
    }

    var main = config.main;
    actions = actions.then(main ?
    function () {
        return execCallModule(context, main);
    } : promise.empty /* if there is no main module, an empty parameter should be passed to onstart */ );

    actions = actions.then(config.onstart);

    return actions.always(function () {
        context = null;
        config = null;
        actions = null;
    });
};

var Context = function (config) {
    this.cache = {};
    var define = bind(this.define, this);
    this.define = define; // allow using define without the scope
    define("asyncRequire.js", [], createAsyncRequire(this));

    config = config || {};
    this.config = config;
    this.resolver = new Resolver(config.resolver);
    this.packaging = new Packaging(config.packaging, this.define);

    var rootModule = new Module(this);
    rootModule.preloaded = true;
    rootModule.loaded = true;
    rootModule.define = define;
    rootModule.asyncRequire = rootModule.require('asyncRequire').create(rootModule);
    this.rootModule = rootModule;

    var globalVarName = config.varName;
    if (globalVarName) {
        global[globalVarName] = rootModule;
    }
    start(this).end();
};

var contextProto = Context.prototype = {};

// Preloading a module means making it ready to be executed (loading its definition and preloading its
// dependencies)
contextProto.preloadModule = function (module, parent) {
    if (module.preloaded) {
        return promise.done;
    }
    if (module.preloading) {
        // If we get here, it may be because of a circular dependency
        // check it here:
        while (parent) {
            if (parent === module) {
                return promise.done;
            }
            parent = parent.parent;
        }
        return module.preloading;
    }
    var self = this;
    if (parent && parent.id != '.') {
        module.parent = parent;
        module.require.main = parent.require.main;
        parent.children.push(module);
    } else {
        module.require.main = module;
    }
    return module.preloading = self.loadDefinition(module).then(function () {
        return self.preloadModules(module, module.definition.dependencies);
    }).then(function () {
        module.preloaded = true;
        module.preloading = false;
    }).always(function () {
        // clean up
        module = null;
        self = null;
    });
};

contextProto.loadDefinition = function (module) {
    if (module.definition) {
        return promise.done;
    }
    var res = module.loadingDefinition;
    if (!res) {
        // store the promise so that it can be resolved when the define method is called:
        module.loadingDefinition = res = promise();
        this.packaging.loadModule(module.filename).then(function () {
            if (res) {
                // if reaching this, and if res is still pending, then it means the module was not found where expected
                res.reject(new Error("Module " + module.filename + " was not found in expected package."));
            }
        }, res.reject);
        res.done(function () {
            res = null;
            module.loadingDefinition = false;
        });
    }
    return res;
};

contextProto.preloadModules = function (module, modules) {
    var promises = [];
    for (var i = 0, l = modules.length; i < l; i++) {
        promises.push(this.preloadModule(this.getModule(this.resolve(module, modules[i])), module));
    }
    return promise.when(promises);
};

contextProto.executePreloadedModule = function (module) {
    if (module.loaded || module.executing) { /* this.executing is true only in the case of a circular dependency */
        return module.exports;
    }
    if (!module.preloaded) {
        throw new Error('A module must be preloaded before executing it.');
    }
    var exports = {};
    module.exports = exports;
    module.executing = true;
    try {
        module.definition.body.call(exports, module, global);
        module.loaded = true;
        return module.exports;
    } finally {
        module.executing = false;
    }
};

contextProto.require = function (module, id) {
    var filename = this.resolve(module, id);
    var newModule = this.cache[filename];
    if (newModule) {
        return this.executePreloadedModule(newModule);
    }
    throw new Error(['Module ', id, ' (', filename, ') is not loaded.'].join(''));
};

contextProto.resolve = function (module, id) {
    return this.resolver.resolve(module.filename, id);
};

contextProto.getModule = function (moduleFilename) {
    if (!moduleFilename) {
        // anonymous module
        return new Module(this);
    }
    var res = this.cache[moduleFilename];
    if (!res) {
        this.cache[moduleFilename] = res = new Module(this, moduleFilename);
    }
    return res;
};

contextProto.define = function (moduleFilename, dependencies, body) {
    this.defineModule(this.getModule(moduleFilename), dependencies, body);
};

contextProto.defineModule = function (module, dependencies, body) {
    if (!module.definition) {
        // do not override an existing definition
        var definition = {
            dependencies: dependencies,
            body: body
        };
        module.definition = definition;
        if (!dependencies.length) {
            module.preloaded = true;
        }
        var loadingDefinition = module.loadingDefinition;
        if (loadingDefinition) {
            if (loadingDefinition.isPending()) {
                loadingDefinition.resolve();
            } else {
                // there was probably an error previously when loading this module
                module.loadingDefinition = false;
            }
        }
    }
    return module;
};

contextProto.executeModule = function (module) {
    var self = this;
    return self.preloadModule(module).then(function () {
        return self.executePreloadedModule(module);
    }).always(function () {
        self = null;
        module = null;
    });
};

contextProto.execute = function (code, moduleFilename) {
    var module = this.getModule(moduleFilename);
    this.defineModule(module, extractDependencies(code), moduleFunction(code));
    return this.executeModule(module);
};

contextProto.asyncRequire = function (module, id) {
    if (isArray(id)) {
        return this.preloadModules(module, id);
    } else {
        return this.require(module, id);
    }
};

contextProto.Context = Context;

module.exports = Context;

});

internalDefine(6 /* merge */, function (module) {

var undef;

var type = internalRequire(14 /* type */);
var isPlainObject = type.isPlainObject;

var extractProperty = function (array, property, startIndex, endIndex) {
    var res = [];
    var index = 0;
    for (var i = startIndex; i < endIndex; i++) {
        var object = array[i];
        if (isPlainObject(object)) {
            var value = object[property];
            if (value != undef) {
                res[index] = value;
                if (index === 0 && !isPlainObject(value)) {
                    // it is not needed to build the whole array
                    // in case the first item is not a plain object
                    break;
                }
                index++;
            }
        }
    }
    return res;
};

var merge = function (objects) {
    var l = objects.length;
    if (l === 0) {
        return undef;
    } else if (l == 1) {
        return objects[0];
    }
    var res;
    for (var i = 0; i < l; i++) {
        var curObject = objects[i];
        if (curObject != undef) {
            if (isPlainObject(curObject)) {
                if (!res) {
                    res = {};
                }
                for (var key in curObject) {
                    if (curObject.hasOwnProperty(key) && !res.hasOwnProperty(key)) {
                        res[key] = merge(extractProperty(objects, key, i, l));
                    }
                }
            } else if (!res) {
                return curObject;
            }
        }
    }
    return res;
};

module.exports = merge;

});

internalDefine(7 /* promise */, function (module) {

var extend = internalRequire(16 /* extend */);
var isFunction = internalRequire(14 /* type */).isFunction;
var callListeners = internalRequire(17 /* callListeners */);

var concat = Array.prototype.concat;

var PENDING_STATE = "pending";

var propagateResults = function (callback, deferred) {
    return function () {
        try {
            // the try...catch here is essential for a correct promises implementation
            // see: https://gist.github.com/3889970
            var res = callback.apply(null, arguments);
            if (res && isFunction(res.then)) {
                res.then(deferred.resolve, deferred.reject);
            } else {
                deferred.resolve(res);
            }
        } catch (e) {
            deferred.reject(e);
        } finally {
            callback = null;
            deferred = null;
        }
    };
};

var endListener = function (error) {
    throw error;
};

var createPromise = function (fn) {
    var deferred = {};
    var state = PENDING_STATE;
    var result = null;
    var listeners = {};

    var listenersMethods = function (newState) {
        var addCb = function () {
            var curListeners;
            if (state === PENDING_STATE) {
                curListeners = listeners[newState] || [];
                listeners[newState] = concat.apply(curListeners, arguments);
            } else if (state === newState) {
                curListeners = concat.apply([], arguments);
                callListeners(curListeners, result);
            }
            return this;
        };
        var fire = function () {
            if (state !== PENDING_STATE) {
                return;
            }
            result = arguments;
            state = newState;
            var myListeners = listeners[newState];
            listeners = null;
            callListeners(myListeners, result);
        };
        return [addCb, fire];
    };
    var done = listenersMethods("resolved");
    var fail = listenersMethods("rejected");

    var promise = {
        state: function () {
            return state;
        },
        isPending: function () {
            return state == PENDING_STATE;
        },
        always: function () {
            deferred.done.apply(deferred, arguments).fail.apply(deferred, arguments);
            return this;
        },
        done: done[0 /*addCb*/ ],
        fail: fail[0 /*addCb*/ ],
        then: function (done, fail) {
            var res = createPromise();
            deferred.done(isFunction(done) ? propagateResults(done, res) : res.resolve);
            deferred.fail(isFunction(fail) ? propagateResults(fail, res) : res.reject);
            return res.promise();
        },
        promise: function (obj) {
            return obj ? extend(obj, promise) : promise;
        },
        end: function () {
            deferred.fail(endListener);
        }
    };
    deferred.resolve = done[1 /*fire*/ ];
    deferred.reject = fail[1 /*fire*/ ];
    promise.promise(deferred);

    if (fn) {
        fn.call(deferred, deferred);
    }
    return deferred;
};

var done = createPromise();
done.resolve();

createPromise.done = done;

createPromise.empty = function () {};

createPromise.noop = function () {
    return done;
};

var countDown = function (state, index) {
    state.counter++;
    return function () {
        if (!state) {
            // already called with this index
            return;
        }
        var array = state.array;
        array[index] = arguments;
        state.counter--;
        if (!state.counter) {
            var promise = state.promise;
            // clean closure variables:
            state.array = null;
            state.promise = null;
            promise.resolve.apply(promise, array);
        }
        // prevent another call with the same index
        state = null;
    };
};

createPromise.when = function () {
    var array = concat.apply([], arguments);
    var promise = createPromise(),
        state, reject;
    for (var i = 0, l = array.length; i < l; i++) {
        var curItem = array[i];
        if (curItem && isFunction(curItem.then)) {
            if (!state) {
                state = {
                    promise: promise,
                    counter: 0,
                    array: array
                };
                reject = promise.reject;
            }
            curItem.then(countDown(state, i), reject);
        }
    }
    if (!state) {
        promise.resolve.apply(promise, array);
    }
    return promise.promise();
};

module.exports = createPromise;

});

internalDefine(8 /* packaging */, function (module) {

var loadFile = internalRequire(18 /* loadFile */);
var extractDependencies = internalRequire(9 /* extractDependencies */);
var moduleFunction = internalRequire(10 /* moduleFunction */);
var packageFunction = internalRequire(19 /* packageFunction */);
var findInMap = internalRequire(20 /* findInMap */);
var split = internalRequire(15 /* path */).split;
var emptyObject = {};

var Packaging = function (config, define) {
    config = config || emptyObject;
    this.config = config;
    this.define = define;
    this.currentLoads = {};
    var bootstrap = config.bootstrap;
    if (bootstrap) {
        bootstrap(define);
    }
};

var packagingProto = Packaging.prototype = {};

packagingProto.loadModule = function (moduleName) {
    var packageName;
    var packagesMap = this.config.packagesMap;
    if (packagesMap) {
        var splitModuleName = split(moduleName);
        packageName = findInMap(packagesMap || emptyObject, splitModuleName, null);
    }
    if (packageName) {
        return this.loadPackaged(packageName);
    } else {
        return this.loadUnpackaged(moduleName);
    }
};

packagingProto.loadUnpackaged = function (moduleName) {
    var url = (this.config.baseUrl || "") + moduleName;
    var define = this.define;
    return loadFile(url).then(function (jsCode) {
        var dependencies = extractDependencies(jsCode);
        var body = moduleFunction(jsCode, url);
        define(moduleName, dependencies, body);
    }).always(function () {
        define = null;
    });
};

packagingProto.loadPackaged = function (packageName) {
    var self = this;
    var url = (self.config.baseUrl || "") + packageName;
    var res = self.currentLoads[url];
    if (!res) {
        self.currentLoads[url] = res = loadFile(url).then(function (jsCode) {
            var body = packageFunction(jsCode, url);
            body(self.define);
        }).always(function () {
            delete self.currentLoads[url];
            self = null;
        });
    }
    return res;
};
module.exports = Packaging;

});

internalDefine(9 /* extractDependencies */, function (module) {

var splitRegExp = /(?=[\/'"]|\brequire\s*\()/;
var requireRegExp = /^require\s*\(\s*$/;
var endOfLineRegExp = /[\r\n]/;
var quoteRegExp = /^['"]$/;
var operatorRegExp = /^[!%&\(*+,\-\/:;<=>?\[\^]$/;
var lastNonSpaceCharRegExp = /\S\s*$/;

var isEscaped = function (string) {
    var escaped = false;
    var index = string.length - 1;
    while (index >= 0 && string.charAt(index) == '\\') {
        index--;
        escaped = !escaped;
    }
    return escaped;
};

var getLastNonSpaceChar = function (array, i) {
    for (; i >= 0; i--) {
        var curItem = array[i];
        var index = curItem.search(lastNonSpaceCharRegExp);
        if (index > -1) {
            return curItem.charAt(index);
        }
    }
    return "";
};

var checkRequireScope = function (array, i) {
    return i === 0 || getLastNonSpaceChar(array, i - 1) != ".";
};

var isRegExp = function (array, i) {
    return i === 0 || operatorRegExp.test(getLastNonSpaceChar(array, i - 1));
};

var findEndOfStringOrRegExp = function (array, i) {
    var expectedEnd = array[i].charAt(0);
    i++;
    for (var l = array.length; i < l; i++) {
        var item = array[i].charAt(0);
        if (item === expectedEnd) {
            if (!isEscaped(array[i - 1])) {
                return i;
            }
        }
    }
    throw new Error("Unterminated string or regexp.");
};

var getStringContent = function (array, begin, end) {
    // The string is supposed not to contain any special things such as: \n \r \t \' \"
    return array.slice(begin, end).join('').substring(1);
};

var findEndOfSlashComment = function (array, beginIndex) {
    for (var i = beginIndex + 1, l = array.length; i < l; i++) {
        var curItem = array[i];
        var index = curItem.search(endOfLineRegExp);
        if (index > -1) {
            array[i] = curItem.substring(index);
            array.splice(beginIndex, i - beginIndex);
            return beginIndex;
        }
    }
    return i;
};

var findEndOfStarComment = function (array, beginIndex) {
    var i = beginIndex + 1;
    if (array[beginIndex] == "/*") {
        i++;
    }
    for (var l = array.length; i < l; i++) {
        var prevItem = array[i - 1];
        if (prevItem.charAt(prevItem.length - 1) == '*' && array[i].charAt(0) == '/') {
            array.splice(beginIndex, i + 1 - beginIndex);
            return beginIndex - 1;
        }
    }
    return i;
};

module.exports = function (source) {
    var ids = [];
    var i = 0;
    var array = source.split(splitRegExp);
    for (var l = array.length; i < l && i >= 0; i++) {
        var curItem = array[i];
        var firstChar = curItem.charAt(0);
        if (firstChar == '/') {
            // it may be a comment, a division or a regular expression
            if (curItem == '/' && i + 1 < l && array[i + 1].charAt(0) == '/') {
                i = findEndOfSlashComment(array, i);
                l = array.length; // when processing comments, the array is changed
            } else if (curItem.charAt(1) == "*") {
                i = findEndOfStarComment(array, i);
                l = array.length; // when processing comments, the array is changed
            } else if (isRegExp(array, i)) {
                i = findEndOfStringOrRegExp(array, i);
            }
        } else if (quoteRegExp.test(firstChar)) {
            i = findEndOfStringOrRegExp(array, i);
        } else if (firstChar == "r") {
            if (requireRegExp.test(curItem) && i + 2 < l && checkRequireScope(array, i)) {
                var newI = i + 1;
                if (quoteRegExp.test(array[newI].charAt(0))) {
                    i = findEndOfStringOrRegExp(array, newI);
                    ids.push(getStringContent(array, newI, i));
                }
            }
        }
    }
    return ids;
};

});

internalDefine(10 /* moduleFunction */, function (module) {

var exec = internalRequire(4 /* eval */);

module.exports = function (jsCode, filename) {
    var code = ['(function(module, global){\nvar require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;\n\n', jsCode, '\n\n})'];
    return exec(code.join(''), filename);
};

});

internalDefine(11 /* execCallModule */, function (module) {

module.exports = function (context, mainModule) {
    var startMainMethodParams = mainModule.indexOf('(');
    if (startMainMethodParams > -1) {
        var startMainMethodName = mainModule.lastIndexOf('/', startMainMethodParams);
        if (startMainMethodName < 0) {
            throw new Error("Invalid module call: " + mainModule);
        }
        var methodNameAndArgs = mainModule.substring(startMainMethodName + 1);
        mainModule = mainModule.substring(0, startMainMethodName);
        return context.execute(['module.exports = require("', mainModule, '");\nmodule.exports.', methodNameAndArgs].join(''));
    } else {
        mainModule = context.rootModule.require.resolve(mainModule);
        return context.executeModule(context.getModule(mainModule));
    }
};

});

internalDefine(12 /* resolver */, function (module) {

var path = internalRequire(15 /* path */);
var isString = internalRequire(14 /* type */).isString;
var findInMap = internalRequire(20 /* findInMap */);
var split = path.split;
var merge = internalRequire(6 /* merge */);
var emptyObject = {};

var addExtension = function (pathArray) {
    var index = pathArray.length - 1;
    var lastItem = pathArray[index];
    if (lastItem.indexOf('.') == -1) {
        pathArray[index] = lastItem + '.js';
    }
};

var normalize = function (pathArray) {
    for (var i = 0, l = pathArray.length; i < l; i++) {
        var currentPart = pathArray[i];
        if (!currentPart.length || currentPart == '.') {
            pathArray.splice(i, 1);
            i--;
            l--;
        } else if (currentPart == '..' && i > 0 && pathArray[i - 1] != '..') {
            pathArray.splice(i - 1, 2);
            i -= 2;
            l -= 2;
        }
    }
    return pathArray;
};

var applyChange = function (terms, item, index) {
    var itemParts = split(item);
    if (!itemParts[0].length) {
        // item starts with /, replaces the whole terms
        itemParts.shift();
        itemParts.unshift(0, index + 1);
    } else {
        // item is relative
        itemParts.unshift(index, 1);
    }
    terms.splice.apply(terms, itemParts);
};

/**
 * Apply a module map iteration.
 * @param {Object} map
 * @param {Array} terms Note that this array is changed by this function.
 * @return {Boolean}
 */
var applyModuleMap = function (map, terms) {
    for (var i = 0, l = terms.length; i < l; i++) {
        var curTerm = terms[i];
        map = map[curTerm];
        if (!map || curTerm === map) {
            return false; // no change
        } else if (isString(map)) {
            applyChange(terms, map, i);
            return true;
        }
    }
    // if we reach this place, it is a directory
    applyChange(terms, map['.'] || "index.js", terms.length);
    return true;
};

var multipleApplyModuleMap = function (map, terms) {
    var allValues = {};
    // curValue can never be equal to ".", as it is always assigned after normalizing
    var lastValue = ".";
    normalize(terms);
    var curValue = terms.join('/');
    while (curValue !== lastValue) {
        if (terms[0] == '..') {
            throw new Error('Trying to go upper than the root of modules.');
        }
        if (allValues[curValue]) {
            throw new Error('Infinite loop in configuration.');
        } else {
            allValues[curValue] = lastValue;
        }
        if (applyModuleMap(map, terms)) {
            normalize(terms);
        }
        lastValue = curValue;
        curValue = terms.join('/');
    }
};

var Resolver = function (config) {
    this.config = config || emptyObject;
    this.cache = {};
};
var resolverProto = Resolver.prototype = {};

resolverProto.resolve = function (callerModule, calledModule) {
    // Compute the configuration to apply to the caller module:
    var callerModuleSplit = split(callerModule);
    var profiles = findInMap(this.config.activations || emptyObject, callerModuleSplit, "");
    var moduleMap = this.computeMap(profiles);

    var res = split(calledModule);
    var firstPart = res[0];
    if (firstPart === '.' || firstPart === '..') {
        callerModuleSplit.pop(); // keep only the directory
        res = callerModuleSplit.concat(res);
    }

    multipleApplyModuleMap(moduleMap, res);
    addExtension(res);
    return res.join('/');
};

resolverProto.computeMap = function (profilesKey) {
    var cache = this.cache;
    var res = cache[profilesKey];
    if (!res) {
        var config = this.config;
        var profiles = config.profiles;
        var profilesObjects = [];
        if (profilesKey.length) {
            var profilesArray = profilesKey.split(',');
            for (var i = 0, l = profilesArray.length; i < l; i++) {
                profilesObjects[i] = profiles[profilesArray[i]];
            }
        }
        profilesObjects.push(config['default'] || emptyObject);
        res = merge(profilesObjects);
        cache[profilesKey] = res;
    }
    return res;
};

module.exports = Resolver;

});

internalDefine(13 /* execScripts */, function (module) {

var promise = internalRequire(7 /* promise */);
var domReady = internalRequire(21 /* domReady */);

module.exports = function (context, scriptType) {
    return domReady().then(function () {
        var scripts = global.document.getElementsByTagName('script');
        var promises = [];
        for (var i = 0, l = scripts.length; i < l; i++) {
            var curScript = scripts[i];
            if (curScript.type === scriptType) {
                var filename = curScript.getAttribute('data-filename');
                promises.push(context.execute(curScript.innerHTML, filename));
            }
        }
        return promise.when(promises);
    });
};

});

internalDefine(14 /* type */, function (module) {

var toString = Object.prototype.toString;
var isString = function (str) {
    return (typeof str === "string") || toString.call(str) === '[object String]';
};
var isArray = Array.isArray ||
function (obj) {
    return toString.call(obj) === '[object Array]';
};

var isFunction = function (fn) {
    return (typeof fn == "function");
};

var isPlainObject = function (obj) {
    return obj ? toString.call(obj) === '[object Object]' : false;
};

module.exports = {
    isFunction: isFunction,
    isArray: isArray,
    isString: isString,
    isPlainObject: isPlainObject
};

});

internalDefine(15 /* path */, function (module) {

var pathSplitRegExp = /\//;

var split = function (name) {
    if (!name.length) {
        return [];
    } else {
        return name.split(pathSplitRegExp);
    }
};

var dirname = function (name) {
    var array = split(name);
    array.pop();
    return array.join('/');
};

module.exports = {
    split: split,
    dirname: dirname
};

});

internalDefine(16 /* extend */, function (module) {

module.exports = function (dst, src) {
    for (var key in src) {
        if (src.hasOwnProperty(key)) {
            dst[key] = src[key];
        }
    }
    return dst;
};

});

internalDefine(17 /* callListeners */, function (module) {

var nextTick = internalRequire(22 /* nextTick */);

module.exports = function (listeners, result) {
    if (listeners && listeners.length) {
        nextTick(function () {
            for (var i = 0, l = listeners.length; i < l; i++) {
                var curItem = listeners[i];
                curItem.apply(null, result);
            }
            listeners = null;
            result = null;
        });
    }
};

});

internalDefine(18 /* loadFile */, function (module) {

var promise = internalRequire(7 /* promise */);
var HttpRequestObject = global.XMLHttpRequest;
var newHttpRequestObject;

if (HttpRequestObject) {
    newHttpRequestObject = function () {
        return new HttpRequestObject();
    };
} else {
    HttpRequestObject = global.ActiveXObject;
    newHttpRequestObject = function () {
        return new HttpRequestObject("Microsoft.XMLHTTP");
    };
}

var createCallback = function (url, xhr, deferred) {
    return function () {
        if (xhr && xhr.readyState == 4) {
            var error = (xhr.status != 200);
            if (error) {
                deferred.reject(new Error(['Error while fetching ', url, '\n', xhr.status, ' ', xhr.statusText].join('')));
            } else {
                deferred.resolve(xhr.responseText);
            }
            // clean the closure:
            url = xhr = deferred = null;
        }
    };
};

module.exports = function (url) {
    var deferred = promise();
    var xhr = newHttpRequestObject();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = createCallback(url, xhr, deferred);
    // Note that, on IE, onreadystatechange can be called during the call to send
    xhr.send(null);
    return deferred.promise();
};

});

internalDefine(19 /* packageFunction */, function (module) {

var exec = internalRequire(4 /* eval */);

module.exports = function (jsCode, filename) {
    var code = ['(function(define){\n', jsCode, '\n})'];
    return exec(code.join(''), filename);
};

});

internalDefine(20 /* findInMap */, function (module) {

var isPlainObject = internalRequire(14 /* type */).isPlainObject;

module.exports = function (map, terms, defaultValue) {
    if (!map) {
        return defaultValue;
    }
    defaultValue = map['**'] || defaultValue;
    for (var i = 0, l = terms.length; i < l; i++) {
        var curTerm = terms[i];
        var value = map[curTerm];
        if (!value) {
            return map['*'] || map['**'] || defaultValue;
        } else if (!isPlainObject(value)) {
            return value;
        }
        defaultValue = map['**'] || defaultValue;
        map = value;
    }
    return map['.'] || map['*'] || map['**'] || defaultValue;
};

});

internalDefine(21 /* domReady */, function (module) {

var promise = internalRequire(7 /* promise */);
var domReadyPromise;
var createDomReadyPromise = function () {
    var document = global.document;
    if (document && document.readyState === "complete") {
        // in this simple case, avoid creating a new promise, just use promise.done
        return promise.done;
    }
    var res = promise();
    if (!document) {
        // this may happen, for example, in a web worker
        res.reject(new Error("No document."));
    } else {
        var callback = function () {
            if (res) {
                res.resolve(); // resolve with no parameter
            }
        };
        if (document.addEventListener) {
            document.addEventListener("DOMContentLoaded", callback);
            // Fallback in case the browser does not support DOMContentLoaded:
            global.addEventListener("load", callback);
            res.always(function () {
                // clean the closure and listeners
                document.removeEventListener("DOMContentLoaded", callback);
                global.removeEventListener("load", callback);
                document = null;
                callback = null;
                res = null;
            });
        } else if (document.attachEvent) {
            // Fallback to the onload event on IE:
            global.attachEvent("onload", callback);
            res.always(function () {
                // clean the closure and listeners
                global.detachEvent("onload", callback);
                document = null;
                callback = null;
                res = null;
            });
        }
    }
    return res.promise();
};

module.exports = function () {
    if (!domReadyPromise) {
        domReadyPromise = createDomReadyPromise();
    }
    return domReadyPromise;
};

});

internalDefine(22 /* nextTick */, function (module) {

var setTimeout = global.setTimeout;
module.exports = function (fn) {
    setTimeout(fn, 0);
};

});

return internalRequire(1);
})((function(){return this;})(),function(c){
/*jshint evil:true */
eval(c);
}).create();