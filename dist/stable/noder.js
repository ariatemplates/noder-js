/*
 * Noder-js 1.6.0 - 18 Jul 2014
 * https://github.com/ariatemplates/noder-js
 *
 * Copyright 2009-2014 Amadeus s.a.s.
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

/*jshint undef:true, -W069, -W055*/
(function(global, callEval, packagedConfig) {
    "use strict";
    var type$module, nextTick$module, uncaughtError$module, asyncCall$module, bind$module, promise$module, packagedConfig$module, noderError$module, request$module, eval$module, jsEval$module, findInMap$module, path$module, scriptTag$module, scriptBaseUrl$module, filters$module, merge$module, loader$module, resolver$module, domReady$module, execScripts$module, findRequires$module, context$module, defaultConfig$module, main$module;
        (function() {
        var toString = Object.prototype.toString;
        var isString = function(str) {
            return typeof str === "string" || toString.call(str) === "[object String]";
        };
        var isArray = Array.isArray || function(obj) {
            return toString.call(obj) === "[object Array]";
        };
        var isFunction = function(fn) {
            return typeof fn == "function";
        };
        var isObject = function(obj) {
            return obj && typeof obj == "object";
        };
        var isPlainObject = function(obj) {
            return obj ? toString.call(obj) === "[object Object]" : false;
        };
        type$module = {
            isFunction: isFunction,
            isArray: isArray,
            isString: isString,
            isObject: isObject,
            isPlainObject: isPlainObject
        };
    })();
        (function() {
        var setTimeout = global.setTimeout;
        nextTick$module = function(fn) {
            setTimeout(fn, 0);
        };
    })();
    uncaughtError$module = function(e) {
        /*nextTick*/ nextTick$module(function() {
            if (e.logDetails) {
                e.logDetails();
            }
            throw e;
        });
    };
        (function() {
        var handlers = [];
        var insideSyncTick = false;
        var syncCall = function(method) {
            try {
                method();
            } catch (e) {
                /*uncaughtError*/ uncaughtError$module(e);
            }
        };
        var syncCalls = function(callbacks) {
            while (callbacks.length > 0) {
                syncCall(callbacks.shift());
            }
        };
        var syncTick = function() {
            insideSyncTick = true;
            try {
                syncCalls(handlers);
            } finally {
                insideSyncTick = false;
            }
        };
        var improvedNextTick = function(fn) {
            if (handlers.length === 0 && !insideSyncTick) {
                /*nextTick*/ nextTick$module(syncTick);
            }
            handlers.push(fn);
        };
        asyncCall$module = {
            syncTick: syncTick,
            nextTick: improvedNextTick,
            nextTickCalls: function(callbacks) {
                if (callbacks && callbacks.length > 0) {
                    improvedNextTick(function() {
                        syncCalls(callbacks);
                    });
                }
            },
            syncCalls: syncCalls,
            syncCall: syncCall
        };
    })();
    bind$module = function(fn, scope, paramBind) {
        return function(param) {
            return fn.call(scope, paramBind, param);
        };
    };
        (function() {
        var isFunction = /*typeUtils*/ type$module.isFunction;
        var isObject = /*typeUtils*/ type$module.isObject;
        var wrapResolutionFn = function(resFn, promiseError) {
            var called;
            var checkCalls = function(fn, value) {
                if (!called) {
                    called = true;
                    fn(value);
                }
            };
            return [ /*bind1*/ bind$module(checkCalls, null, function(value) {
                if (promiseError && value === promiseError) {
                    resFn[1](new TypeError());
                    return;
                }
                chainAnswer(value, resFn);
            }), /*bind1*/ bind$module(checkCalls, null, resFn[1]) ];
        };
        var chainAnswer = function(value, resFn) {
            try {
                if (isFunction(value) || isObject(value)) {
                    var then = value.thenSync || value.then;
                    if (isFunction(then)) {
                        resFn = wrapResolutionFn(resFn);
                        then.call(value, resFn[0], resFn[1]);
                        return;
                    }
                }
                resFn[0](value);
            } catch (ex) {
                resFn[1](ex);
            }
        };
        var Promise = function(callback) {
            var promise = this;
            var state;
            // undefined = pending, 1 fulfilled, 2 rejected
            var result;
            var listeners = [];
            var createThen = function(sync, callFunction) {
                promise["then" + sync] = function(onFulfilled, onRejected) {
                    onFulfilled = isFunction(onFulfilled) ? onFulfilled : null;
                    onRejected = isFunction(onRejected) ? onRejected : null;
                    if (!onFulfilled && !onRejected) {
                        return promise;
                    }
                    return new Promise(function(fulfill, reject) {
                        var callback = function() {
                            var fn = state == 1 ? onFulfilled : onRejected;
                            if (fn) {
                                try {
                                    fulfill(fn(result));
                                } catch (e) {
                                    reject(e);
                                }
                            } else {
                                (state == 1 ? fulfill : reject)(result);
                            }
                        };
                        if (listeners) {
                            listeners.push(callback);
                        } else {
                            callFunction(callback);
                        }
                    });
                };
            };
            createThen("", /*asyncCall*/ asyncCall$module.nextTick);
            createThen("Sync", /*asyncCall*/ asyncCall$module.syncCall);
            var isX = function(refState) {
                return state == refState;
            };
            promise.isFulfilled = /*bind1*/ bind$module(isX, null, 1);
            promise.isRejected = /*bind1*/ bind$module(isX, null, 2);
            promise.result = function() {
                return result;
            };
            var resolve = function(newState, value) {
                if (listeners) {
                    result = value;
                    state = newState;
                    var myListeners = listeners;
                    listeners = null;
                    /*asyncCall*/ asyncCall$module.nextTickCalls(myListeners);
                }
            };
            var resFn = [ /*bind1*/ bind$module(resolve, null, 1), /*bind1*/ bind$module(resolve, null, 2) ];
            resFn = wrapResolutionFn(resFn, promise);
            try {
                callback(resFn[0], resFn[1]);
            } catch (e) {
                resFn[1](e);
            }
        };
        Promise.resolve = function(value) {
            if (value instanceof Promise) {
                return value;
            }
            return new Promise(function(fulfill) {
                fulfill(value);
            });
        };
        Promise.reject = function(reason) {
            return new Promise(function(fulfill, reject) {
                reject(reason);
            });
        };
        Promise.defer = function() {
            var res = {};
            res.promise = new Promise(function(fulfill, reject) {
                res.resolve = fulfill;
                res.reject = reject;
            });
            return res;
        };
        Promise.done = Promise.resolve();
        var promiseProto = Promise.prototype = {};
        var wrapForSpread = function(onFulfilled, res) {
            return onFulfilled.apply(null, res);
        };
        var createProtoMethods = function(sync) {
            var thenSync = "then" + sync;
            promiseProto["spread" + sync] = function(onFulfilled, onRejected) {
                /*bind1*/
                return this[thenSync](bind$module(wrapForSpread, null, onFulfilled), onRejected);
            };
            promiseProto["catch" + sync] = function(onRejected) {
                return this[thenSync](null, onRejected);
            };
            promiseProto["finally" + sync] = function(handler) {
                return this[thenSync](handler, handler);
            };
            promiseProto["done" + sync] = function(onFulfilled, onRejected) {
                this[thenSync](onFulfilled, onRejected).thenSync(null, /*uncaughtError*/ uncaughtError$module);
            };
        };
        createProtoMethods("");
        createProtoMethods("Sync");
        var createAll = function(failFast) {
            return function(array) {
                return new Promise(function(fulfill, reject) {
                    if (array.length === 0) {
                        return fulfill([]);
                    }
                    array = array.slice(0);
                    // make a copy of the array (to be able to change it)
                    var globalOk = true;
                    var globalResult = array;
                    var remainingPromisesCount = array.length;
                    var handler = function(success, result) {
                        array[this[0]] = result;
                        if (globalOk && !success) {
                            globalOk = false;
                            globalResult = result;
                            if (failFast) {
                                remainingPromisesCount = 1;
                            }
                        }
                        remainingPromisesCount--;
                        if (!remainingPromisesCount) {
                            (globalOk ? fulfill : reject).call(null, globalResult);
                        }
                    };
                    for (var i = remainingPromisesCount - 1; i >= 0; i--) {
                        var scope = [ i ];
                        chainAnswer(array[i], [ /*bind1*/ bind$module(handler, scope, true), /*bind1*/ bind$module(handler, scope, false) ]);
                    }
                });
            };
        };
        Promise.all = createAll(true);
        Promise.allSettled = createAll(false);
        promise$module = Promise;
    })();
    packagedConfig$module = packagedConfig;
        (function() {
        var errorNb = 0;
        var logDetails = function() {
            var async = false;
            var self = this;
            var res = getHandler().thenSync(function(syncLogDetails) {
                return syncLogDetails(self, async);
            });
            async = true;
            return res;
        };
        var handlerPromise;
        var getHandler = function() {
            if (!handlerPromise) {
                var errorConfig = packagedConfig$module().errorContext;
                var loadingContext = new /*Context*/ context$module(errorConfig);
                handlerPromise = loadingContext.moduleExecute(loadingContext.getModule(errorConfig.main));
            }
            return handlerPromise;
        };
        var createError = function(code, args, cause) {
            var id = ++errorNb;
            var error = new Error("NoderError #" + id + ": " + code);
            error.name = "NoderError";
            error.id = id;
            error.code = code;
            error.args = args;
            error.cause = cause;
            error.logDetails = logDetails;
            return error;
        };
        noderError$module = createError;
    })();
        (function() {
        var HttpRequestObject = global.XMLHttpRequest;
        var newHttpRequestObject;
        if (HttpRequestObject) {
            newHttpRequestObject = function() {
                return new HttpRequestObject();
            };
        } else {
            HttpRequestObject = global.ActiveXObject;
            newHttpRequestObject = function() {
                return new HttpRequestObject("Microsoft.XMLHTTP");
            };
        }
        var createCallback = function(url, xhr, fulfill, reject) {
            return function() {
                if (xhr && xhr.readyState == 4) {
                    var error = xhr.status != 200;
                    if (error) {
                        reject(/*noderError*/ noderError$module("XMLHttpRequest", [ url, xhr ]));
                    } else {
                        fulfill(xhr);
                    }
                    // clean the closure:
                    url = xhr = fulfill = reject = null;
                    return true;
                }
            };
        };
        request$module = function(url, options) {
            /*Promise*/
            return new promise$module(function(fulfill, reject) {
                options = options || {};
                var xhr = newHttpRequestObject();
                var headers = options.headers || {};
                xhr.open(options.method || "GET", url, !options.sync);
                for (var key in headers) {
                    if (headers.hasOwnProperty(key)) {
                        xhr.setRequestHeader(key, headers[key]);
                    }
                }
                xhr.send(options.data);
                var checkState = createCallback(url, xhr, fulfill, reject);
                if (!checkState()) {
                    // only set onreadystatechange if it is useful
                    // (i.e. the response is not available synchronously)
                    xhr.onreadystatechange = checkState;
                }
            });
        };
    })();
    eval$module = function(code, fileName) {
        var res = {};
        // Using the 'arguments[1].res = ...' trick because IE does not let eval return a function
        if (fileName) {
            code = [ "/*\n * File: ", fileName, "\n */\narguments[1].res=", code, "\n//# sourceURL=", fileName ].join("");
        } else {
            code = "arguments[1].res=" + code;
        }
        callEval(code, res);
        // callEval is defined outside of any closure
        return res.res;
    };
    jsEval$module = function(jsCode, url, prefix, suffix) {
        try {
            /*exec*/
            return eval$module((prefix || "") + jsCode + (suffix || ""), url);
        } catch (error) {
            /*noderError*/
            throw noderError$module("jsEval", [ jsCode, url, prefix, suffix ], error);
        }
    };
        (function() {
        var isPlainObject = type$module.isPlainObject;
        findInMap$module = function(map, terms, defaultValue) {
            if (!map) {
                return defaultValue;
            }
            defaultValue = map["**"] || defaultValue;
            for (var i = 0, l = terms.length; i < l; i++) {
                var curTerm = terms[i];
                var value = map[curTerm];
                if (!value) {
                    return map["*"] || map["**"] || defaultValue;
                } else if (!isPlainObject(value)) {
                    return value;
                }
                defaultValue = map["**"] || defaultValue;
                map = value;
            }
            return map["."] || map["*"] || map["**"] || defaultValue;
        };
    })();
        (function() {
        var split = function(name) {
            if (!name.length) {
                return [];
            } else {
                return name.split("/");
            }
        };
        var dirname = function(name) {
            var array = split(name);
            array.pop();
            return array.join("/");
        };
        path$module = {
            split: split,
            dirname: dirname
        };
    })();
        (function() {
        var document = global.document || {};
        var getLastScript = function() {
            // When not in the "loading" mode, it is not reliable to use the last script to find the configuration
            // IE is using the "interactive" mode instead of "loading".
            if (document.readyState == "loading" || document.readyState == "interactive") {
                var scripts = document.getElementsByTagName("script");
                return scripts[scripts.length - 1];
            }
        };
        scriptTag$module = document.currentScript || getLastScript() || {};
    })();
    scriptBaseUrl$module = function() {
        var src = scriptTag$module.src;
        return src ? path$module.dirname(src.replace(/\?.*$/, "")) + "/" : "";
    };
    filters$module = function(context, filterConfig, filename, args) {
        var items = (filterConfig || []).slice(0);
        var next = function(content) {
            args[0] = content;
            if (!items.length) {
                /*Promise*/
                return promise$module.resolve(content);
            }
            var currentFilter = items.shift();
            if (currentFilter.pattern && currentFilter.pattern.test(filename)) {
                return context.moduleAsyncRequire(context.rootModule, [ currentFilter.module ]).spreadSync(function(processor) {
                    /*Promise*/
                    return promise$module.resolve(processor.apply(null, args.concat(currentFilter.options))).thenSync(next);
                });
            } else {
                return next(args[0]);
            }
        };
        return next(args[0]);
    };
        (function() {
        var merge = function(dst, src, rec) {
            for (var key in src) {
                if (src.hasOwnProperty(key)) {
                    var srcValue = src[key];
                    var dstValue;
                    if (rec && /*typeUtils*/ type$module.isPlainObject(srcValue) && /*typeUtils*/ type$module.isPlainObject(dstValue = dst[key])) {
                        merge(dstValue, srcValue, rec);
                    } else {
                        dst[key] = srcValue;
                    }
                }
            }
        };
        merge$module = merge;
    })();
        (function() {
        var split = path$module.split;
        var emptyObject = {};
        var xhrContent = function(xhr) {
            return xhr.responseText;
        };
        var Loader = function(context) {
            var config = context.config.packaging || emptyObject;
            this.config = config;
            this.baseUrl = (config.baseUrl || "").replace(/^%scriptdir%\//, /*scriptBaseUrl*/ scriptBaseUrl$module());
            this.context = context;
            this.currentLoads = {};
            var bootstrap = config.bootstrap;
            if (bootstrap) {
                bootstrap(context.define);
            }
        };
        var loaderProto = Loader.prototype = {};
        loaderProto.moduleLoad = function(module) {
            var moduleName = module.filename;
            var packageName;
            var packagesMap = this.config.packagesMap;
            if (packagesMap) {
                var splitModuleName = split(moduleName);
                packageName = /*findInMap*/ findInMap$module(packagesMap || emptyObject, splitModuleName, null);
            }
            if (packageName) {
                return this.loadPackaged(packageName);
            } else {
                return this.loadUnpackaged(module);
            }
        };
        loaderProto.loadUnpackaged = function(module) {
            module.url = this.baseUrl + module.filename;
            /*request*/
            /*bind1*/
            return request$module(module.url, this.config.requestConfig).thenSync(xhrContent).thenSync(bind$module(this.preprocessUnpackaged, this, module));
        };
        loaderProto.preprocessUnpackaged = function(module, code) {
            var preprocessors = this.config.preprocessors;
            if (!preprocessors || !preprocessors.length) {
                return this.defineUnpackaged(module, code);
            } else {
                /*filters*/
                /*bind1*/
                return filters$module(this.context, preprocessors, module.filename, [ code, module.filename ]).thenSync(bind$module(this.defineUnpackaged, this, module));
            }
        };
        loaderProto.defineUnpackaged = function(module, code) {
            this.context.jsModuleDefine(code, module.filename, module.url);
        };
        loaderProto.loadPackaged = function(packageName) {
            var self = this;
            var url = self.baseUrl + packageName;
            var res = self.currentLoads[url];
            if (!res) {
                self.currentLoads[url] = res = /*request*/ request$module(url, self.config.requestConfig).thenSync(xhrContent).thenSync(function(content) {
                    var body = self.jsPackageEval(content, url);
                    body(self.context.define);
                })["finally"](function() {
                    delete self.currentLoads[url];
                    self = null;
                });
            }
            return res;
        };
        loaderProto.jsPackageEval = function(jsCode, url) {
            /*jsEval*/
            return jsEval$module(jsCode, url, "(function(define){\n", "\n})");
        };
        loaderProto.updatePackagesMap = function(newMap) {
            var config = this.config;
            if (config.packagesMap) {
                /*merge*/ merge$module(config.packagesMap, newMap, true);
            } else {
                config.packagesMap = newMap;
            }
        };
        loader$module = Loader;
    })();
        (function() {
        var isString = type$module.isString;
        var split = /*path*/ path$module.split;
        var emptyObject = {};
        var addExtension = function(pathArray) {
            var index = pathArray.length - 1;
            var lastItem = pathArray[index];
            if (lastItem.indexOf(".") == -1) {
                pathArray[index] = lastItem + ".js";
            }
        };
        var normalize = function(pathArray) {
            for (var i = 0, l = pathArray.length; i < l; i++) {
                var currentPart = pathArray[i];
                if (!currentPart.length || currentPart == ".") {
                    pathArray.splice(i, 1);
                    i--;
                    l--;
                } else if (currentPart == ".." && i > 0 && pathArray[i - 1] != "..") {
                    pathArray.splice(i - 1, 2);
                    i -= 2;
                    l -= 2;
                }
            }
            return pathArray;
        };
        var applyChange = function(terms, item, index) {
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
        var applyModuleMap = function(map, terms) {
            for (var i = 0, l = terms.length; i < l; i++) {
                var curTerm = terms[i];
                map = map[curTerm];
                if (!map || curTerm === map) {
                    return false;
                } else if (isString(map)) {
                    applyChange(terms, map, i);
                    return true;
                }
            }
            // if we reach this place, it is a directory
            applyChange(terms, map["."] || "index.js", terms.length);
            return true;
        };
        var multipleApplyModuleMap = function(map, terms) {
            var allValues = {};
            // curValue can never be equal to ".", as it is always assigned after normalizing
            var lastValue = ".";
            normalize(terms);
            var curValue = terms.join("/");
            while (curValue !== lastValue) {
                if (terms[0] == "..") {
                    /*noderError*/
                    throw noderError$module("resolverRoot", [ terms ]);
                }
                if (allValues[curValue]) {
                    /*noderError*/
                    throw noderError$module("resolverLoop", [ terms ]);
                } else {
                    allValues[curValue] = lastValue;
                }
                if (applyModuleMap(map, terms)) {
                    normalize(terms);
                }
                lastValue = curValue;
                curValue = terms.join("/");
            }
        };
        var Resolver = function(context) {
            this.config = context.config.resolver || emptyObject;
            this.cache = {};
        };
        var resolverProto = Resolver.prototype = {};
        resolverProto.moduleResolve = function(callerModule, calledModule) {
            // Compute the configuration to apply to the caller module:
            var callerModuleSplit = split(callerModule.filename);
            var moduleMap = this.config["default"] || emptyObject;
            var res = split(calledModule);
            var firstPart = res[0];
            if (firstPart === "." || firstPart === "..") {
                callerModuleSplit.pop();
                // keep only the directory
                res = callerModuleSplit.concat(res);
            }
            multipleApplyModuleMap(moduleMap, res);
            addExtension(res);
            return res.join("/");
        };
        resolver$module = Resolver;
    })();
        (function() {
        var domReadyPromise;
        var createDomReadyPromise = function() {
            /*Promise*/
            return new promise$module(function(fulfill) {
                var document = global.document;
                if (!document || document.readyState === "complete") {
                    return fulfill();
                }
                var cleanUp;
                var callback = function() {
                    fulfill();
                    // call fulfill with no parameter
                    cleanUp();
                    document = cleanUp = callback = null;
                };
                if (document.addEventListener) {
                    cleanUp = function() {
                        // clean the closure and listeners
                        document.removeEventListener("DOMContentLoaded", callback, false);
                        global.removeEventListener("load", callback, false);
                    };
                    document.addEventListener("DOMContentLoaded", callback, false);
                    // Fallback in case the browser does not support DOMContentLoaded:
                    global.addEventListener("load", callback, false);
                } else if (document.attachEvent) {
                    cleanUp = function() {
                        // clean the closure and listeners
                        global.detachEvent("onload", callback);
                    };
                    // Fallback to the onload event on IE:
                    global.attachEvent("onload", callback);
                }
            });
        };
        domReady$module = function() {
            if (!domReadyPromise) {
                domReadyPromise = createDomReadyPromise();
            }
            return domReadyPromise;
        };
    })();
        (function() {
        var logErrorsAndContinue = function(p) {
            /*uncaughtError*/
            return p.thenSync(function() {}, uncaughtError$module);
        };
        execScripts$module = function(context, scriptType) {
            /*domReady*/
            return logErrorsAndContinue(domReady$module().then(function() {
                var document = global.document;
                var executePromise = /*Promise*/ promise$module.done;
                if (document) {
                    var scripts = document.getElementsByTagName("script");
                    var i, l;
                    for (i = 0, l = scripts.length; i < l; i++) {
                        var curScript = scripts[i];
                        if (curScript.type === scriptType) {
                            var filename = curScript.getAttribute("data-filename");
                            // the try ... catch here allows to go on with the execution of script tags
                            // even if one has a syntax error
                            try {
                                // all scripts are defined before any is executed
                                // so that it is possible to require one script tag from another (in any order)
                                var curModule = context.jsModuleDefine(curScript.innerHTML, filename);
                                executePromise = logErrorsAndContinue(executePromise.then(/*bind1*/ bind$module(context.moduleExecute, context, curModule)));
                            } catch (error) {
                                /*uncaughtError*/ uncaughtError$module(error);
                            }
                        }
                    }
                }
                return executePromise;
            }));
        };
    })();
        (function() {
        var splitRegExp = /(?=[\/'"]|\brequire\s*\()/;
        var requireRegExp = /^require\s*\(\s*$/;
        var endOfLineRegExp = /[\r\n]/;
        var quoteRegExp = /^['"]$/;
        var operatorRegExp = /^(\w{2,}|[!%&\(*+,\-\/:;<=>?\[\^])$/;
        var firstNonSpaceCharRegExp = /^\s*(\S)/;
        var lastNonSpaceCharRegExp = /(\b(return|throw|new|in)|\S)\s*$/;
        var pluginBeginRegExp = /\s*\)\s*\.\s*([_$a-zA-Z][_$a-zA-Z0-9]*)\s*\(\s*(?=(.?))/g;
        var pluginParamRegExp = /[_$a-zA-Z][_$a-zA-Z0-9]*/g;
        var pluginParamSepRegExp = /\s*(\)|,)\s*/g;
        var isEscaped = function(string) {
            var escaped = false;
            var index = string.length - 1;
            while (index >= 0 && string.charAt(index) == "\\") {
                index--;
                escaped = !escaped;
            }
            return escaped;
        };
        var getLastNonSpaceChar = function(array, i) {
            for (;i >= 0; i--) {
                var curItem = array[i];
                if (lastNonSpaceCharRegExp.test(curItem)) {
                    return RegExp.$1;
                }
            }
            return "";
        };
        var checkRequireScope = function(array, i) {
            return i === 0 || getLastNonSpaceChar(array, i - 1) != ".";
        };
        var isRegExp = function(array, i) {
            return i === 0 || operatorRegExp.test(getLastNonSpaceChar(array, i - 1));
        };
        var findEndOfStringOrRegExp = function(array, i) {
            var expectedEnd = array[i].charAt(0);
            i++;
            for (var l = array.length; i < l; i++) {
                var item = array[i].charAt(0);
                if (item === expectedEnd) {
                    if (!isEscaped(array[i - 1])) {
                        break;
                    }
                }
            }
            // here, if i == l, the string or regexp has no end (which is not correct in JS...)
            return i;
        };
        var findEndOfSlashComment = function(array, beginIndex) {
            for (var i = beginIndex + 1, l = array.length; i < l; i++) {
                var curItem = array[i];
                var index = curItem.search(endOfLineRegExp);
                if (index > -1) {
                    array[i] = curItem.substring(index);
                    break;
                }
            }
            array.splice(beginIndex, i - beginIndex);
            return beginIndex;
        };
        var findEndOfStarComment = function(array, beginIndex) {
            var i = beginIndex + 1;
            if (array[beginIndex] == "/*") {
                i++;
            }
            var curItem = array[i - 1];
            for (var l = array.length; i < l; i++) {
                var prevItem = curItem;
                curItem = array[i];
                if (prevItem.charAt(prevItem.length - 1) == "*" && curItem.charAt(0) == "/") {
                    array[i] = curItem.substring(1);
                    break;
                }
            }
            // here, if i == l, the comment has no end (which is not correct in JS...)
            array.splice(beginIndex, i - beginIndex);
            return beginIndex;
        };
        var parseSource = function(source) {
            var stringsPositions = [];
            var requireStrings = [];
            var i = 0;
            var array = source.split(splitRegExp);
            var l = array.length;
            /*
     * inRequireState variable:
     * 0 : outside of any useful require
     * 1 : just reached require
     * 2 : looking for the string
     * 3 : just reached the string
     * 4 : looking for closing parenthesis
     */
            var inRequireState = -1;
            for (;i < l && i >= 0; i++) {
                var curItem = array[i];
                var firstChar = curItem.charAt(0);
                if (firstChar == "/") {
                    // it may be a comment, a division or a regular expression
                    if (curItem == "/" && i + 1 < l && array[i + 1].charAt(0) == "/") {
                        i = findEndOfSlashComment(array, i);
                        l = array.length;
                    } else if (curItem.charAt(1) == "*") {
                        i = findEndOfStarComment(array, i);
                        l = array.length;
                    } else if (isRegExp(array, i)) {
                        i = findEndOfStringOrRegExp(array, i);
                    }
                } else if (quoteRegExp.test(firstChar)) {
                    var beginString = i;
                    i = findEndOfStringOrRegExp(array, i);
                    stringsPositions.push([ beginString, i ]);
                    if (inRequireState == 2) {
                        inRequireState = 3;
                    }
                } else if (firstChar == "r") {
                    if (requireRegExp.test(curItem) && checkRequireScope(array, i)) {
                        inRequireState = 1;
                    }
                }
                if (inRequireState > 0) {
                    if (inRequireState == 1) {
                        inRequireState = 2;
                    } else {
                        curItem = array[i];
                        if (inRequireState == 3) {
                            curItem = curItem.substring(1);
                            inRequireState = 4;
                        }
                        if (firstNonSpaceCharRegExp.test(curItem)) {
                            if (inRequireState == 4 && RegExp.$1 == ")") {
                                // the last string is the parameter of require
                                requireStrings.push(stringsPositions.length - 1);
                            }
                            inRequireState = 0;
                        }
                    }
                }
            }
            return [ array, stringsPositions, requireStrings ];
        };
        var createPositionsConverter = function(array) {
            var positions = [ 0 ];
            for (var i = 1, l = array.length; i <= l; i++) {
                positions[i] = positions[i - 1] + array[i - 1].length;
            }
            return function(pos) {
                return [ positions[pos[0]] + 1, positions[pos[1]] ];
            };
        };
        var getString = function(source, position) {
            // TODO: replace special chars: \n \t \\ ...
            return source.substring.apply(source, position);
        };
        var regExpExecPosition = function(regExp, source, index) {
            regExp.lastIndex = index;
            var match = regExp.exec(source);
            if (match && match.index == index) {
                return match;
            }
        };
        var isPlugin = /(^|\/)\$[^\/]*$/;
        findRequires$module = function(source, includePlugins) {
            var parseInfo = parseSource(source);
            var requireStrings = parseInfo[2];
            var requireStringsLength = requireStrings.length;
            var depMap = {};
            var res = [];
            if (requireStrings.length) {
                var posConverter = createPositionsConverter(parseInfo[0]);
                var stripComment = parseInfo[0].join("");
                var stringsPositions = parseInfo[1];
                var nbStrings = stringsPositions.length;
                for (var i = 0; i < requireStringsLength; i++) {
                    var strIndex = requireStrings[i];
                    var strPos = posConverter(stringsPositions[strIndex]);
                    var curItem = getString(stripComment, strPos);
                    // don't add the dependency more than once
                    if (!depMap[curItem]) {
                        res.push(curItem);
                        depMap[curItem] = true;
                    }
                    if (includePlugins && isPlugin.test(curItem)) {
                        var match = regExpExecPosition(pluginBeginRegExp, stripComment, strPos[1] + 1);
                        if (match) {
                            var method = match[1];
                            var args = [];
                            var nextString = ++strIndex < nbStrings && posConverter(stringsPositions[strIndex]);
                            match[1] = match[2];
                            while (match && match[1] != ")") {
                                var curPos = match.index + match[0].length;
                                if (nextString && curPos + 1 === nextString[0]) {
                                    args.push(getString(stripComment, nextString));
                                    curPos = nextString[1] + 1;
                                    nextString = ++strIndex < nbStrings && posConverter(stringsPositions[strIndex]);
                                } else {
                                    match = regExpExecPosition(pluginParamRegExp, stripComment, curPos);
                                    if (!match) {
                                        break;
                                    }
                                    curPos = pluginParamRegExp.lastIndex;
                                    args.push([ match[0] ]);
                                }
                                match = regExpExecPosition(pluginParamSepRegExp, stripComment, curPos);
                            }
                            if (match) {
                                // this means the call is properly finished with a closing parenthesis
                                res.push({
                                    module: curItem,
                                    method: method,
                                    args: args
                                });
                            }
                        }
                    }
                }
            }
            return res;
        };
    })();
        (function() {
        var dirname = path$module.dirname;
        var bind = function(fn, scope) {
            return function() {
                return fn.apply(scope, arguments);
            };
        };
        var createAsyncRequire = function(context) {
            var create = function(module) {
                var res = function() {
                    return context.moduleAsyncRequire(module, arguments);
                };
                res.create = create;
                return res;
            };
            return create;
        };
        var Module = function(context, filename) {
            if (filename) {
                this.dirname = dirname(filename);
            } else {
                this.dirname = filename = ".";
            }
            this[/*noderPropertiesKey*/ "_noder"] = {};
            this.filename = filename;
            this.id = filename;
            this.require = /*bind1*/ bind$module(context.moduleRequire, context, this);
            this.require.resolve = /*bind1*/ bind$module(context.moduleResolve, context, this);
            this.require.cache = context.cache;
            this.require.main = context.main;
            this.preloaded = false;
            this.loaded = false;
            this.exports = {};
        };
        var getModuleProperty = function(module, property) {
            /*noderPropertiesKey*/
            return module["_noder"][property];
        };
        var setModuleProperty = function(module, property, value) {
            module[/*noderPropertiesKey*/ "_noder"][property] = value;
            return value;
        };
        var start = function(context) {
            var config = context.config;
            var actions = /*Promise*/ promise$module.done;
            var main = config.main;
            actions = actions.thenSync(main ? function() {
                var res = context.main = context.execModuleCall(main);
                return res;
            } : function() {});
            actions = actions.thenSync(config.onstart);
            var scriptsType = config.scriptsType;
            if (scriptsType) {
                actions = actions.thenSync(function() {
                    /*execScripts*/
                    return execScripts$module(context, scriptsType);
                });
            }
            return actions;
        };
        var BuiltinModules = function() {};
        var createInstance = function(configConstructor, defaultConstructor, param) {
            var Constructor = configConstructor || defaultConstructor;
            return new Constructor(param, defaultConstructor);
        };
        var Context = function(config) {
            config = config || {};
            this.config = config;
            this.cache = {};
            this.builtinModules = new BuiltinModules();
            this.allSettled = config.failFast === false ? /*Promise*/ promise$module.allSettled : /*Promise*/ promise$module.all;
            var rootModule = new Module(this);
            rootModule.preloaded = true;
            rootModule.loaded = true;
            rootModule.define = this.define = bind(this.define, this);
            rootModule.asyncRequire = createAsyncRequire(this)(rootModule);
            rootModule.execute = bind(this.jsModuleExecute, this);
            rootModule.createContext = Context.createContext;
            this.rootModule = rootModule;
            this.resolver = createInstance(config.Resolver, /*Resolver*/ resolver$module, this);
            this.loader = createInstance(config.Loader, /*Loader*/ loader$module, this);
            rootModule.updatePackagesMap = bind(this.loader.updatePackagesMap, this.loader);
            var globalVarName = config.varName;
            if (globalVarName) {
                global[globalVarName] = rootModule;
            }
            start(this).done();
        };
        var contextProto = Context.prototype = {};
        var checkCircularDependency = function(module, lookInside) {
            if (lookInside === module) {
                return true;
            }
            var parents = getModuleProperty(lookInside, /*PROPERTY_PRELOADING_PARENTS*/ 5);
            if (parents) {
                for (var i = 0; parents[i]; i++) {
                    if (checkCircularDependency(module, parents[i])) {
                        return true;
                    }
                }
            }
            return false;
        };
        // Preloading a module means making it ready to be executed (loading its definition and preloading its
        // dependencies)
        contextProto.modulePreload = function(module, parent) {
            if (module.preloaded) {
                /*Promise*/
                return promise$module.done;
            }
            var preloading = getModuleProperty(module, /*PROPERTY_PRELOADING*/ 3);
            var preloadingParents = getModuleProperty(module, /*PROPERTY_PRELOADING_PARENTS*/ 5);
            if (preloading || preloadingParents) {
                // If we get here, it may be because of a circular dependency
                if (parent) {
                    if (checkCircularDependency(module, parent)) {
                        /*Promise*/
                        return promise$module.done;
                    }
                    preloadingParents.push(parent);
                }
                if (!preloading) {
                    /*noderError*/
                    throw noderError$module("modulePreloadRec", [ module ]);
                }
                return preloading;
            }
            var self = this;
            setModuleProperty(module, /*PROPERTY_PRELOADING_PARENTS*/ 5, parent ? [ parent ] : []);
            /*PROPERTY_PRELOADING*/
            return setModuleProperty(module, 3, self.moduleLoadDefinition(module).thenSync(function() {
                /*PROPERTY_DEPENDENCIES*/
                return self.modulePreloadDependencies(module, getModuleProperty(module, 1));
            }).thenSync(function() {
                module.preloaded = true;
                setModuleProperty(module, /*PROPERTY_PRELOADING*/ 3, false);
                setModuleProperty(module, /*PROPERTY_PRELOADING_PARENTS*/ 5, null);
            }, function(error) {
                /*noderError*/
                throw noderError$module("modulePreload", [ module ], error);
            }));
        };
        contextProto.moduleLoadDefinition = function(module) {
            if (getModuleProperty(module, /*PROPERTY_DEFINITION*/ 0)) {
                /*Promise*/
                return promise$module.done;
            }
            var res = getModuleProperty(module, /*PROPERTY_LOADING_DEFINITION*/ 4);
            if (!res) {
                var filename = module.filename;
                var builtin = this.builtinModules["/" + filename];
                if (builtin) {
                    this.moduleDefine(module, [], builtin(this));
                    res = /*Promise*/ promise$module.done;
                } else {
                    var asyncOrError = true;
                    var checkResult = function(error) {
                        // check that the definition was correctly loaded:
                        if (getModuleProperty(module, /*PROPERTY_DEFINITION*/ 0)) {
                            asyncOrError = false;
                        } else {
                            /*noderError*/
                            throw noderError$module("moduleLoadDefinition", [ module ], error);
                        }
                    };
                    res = this.loader.moduleLoad(module).thenSync(checkResult, checkResult);
                    if (asyncOrError) {
                        setModuleProperty(module, /*PROPERTY_LOADING_DEFINITION*/ 4, res);
                    }
                }
            }
            return res;
        };
        contextProto.moduleProcessPlugin = function(module, pluginDef) {
            var allowedParameters = {
                module: module,
                __dirname: module.dirname,
                __filename: module.filename,
                "null": null
            };
            var parameters = pluginDef.args.slice(0);
            for (var i = 0, l = parameters.length; i < l; i++) {
                var curParameter = parameters[i];
                if (/*typeUtils*/ type$module.isArray(curParameter)) {
                    curParameter = curParameter[0];
                    if (!allowedParameters.hasOwnProperty(curParameter)) {
                        return;
                    }
                    parameters[i] = allowedParameters[curParameter];
                }
            }
            return this.moduleExecute(this.getModule(this.moduleResolve(module, pluginDef.module))).thenSync(function(plugin) {
                var method = (plugin[pluginDef.method] || {}).$preload;
                if (method) {
                    return method.apply(plugin, parameters);
                }
            }).thenSync(null, function(error) {
                /*noderError*/
                throw noderError$module("moduleProcessPlugin", [ module, pluginDef ], error);
            });
        };
        contextProto.modulePreloadDependencies = function(module, dependencies) {
            var promises = [];
            for (var i = 0, l = dependencies.length; i < l; i++) {
                var curDependency = dependencies[i];
                var curPromise = /*typeUtils*/ type$module.isString(curDependency) ? this.modulePreload(this.getModule(this.moduleResolve(module, curDependency)), module) : this.moduleProcessPlugin(module, curDependency);
                promises.push(curPromise);
            }
            return this.allSettled(promises);
        };
        contextProto.moduleExecuteSync = function(module) {
            if (module.loaded || getModuleProperty(module, /*PROPERTY_EXECUTING*/ 2)) {
                /* this.executing is true only in the case of a circular dependency */
                return module.exports;
            }
            var preloadPromise = this.modulePreload(module);
            if (!preloadPromise.isFulfilled()) {
                /*noderError*/
                throw noderError$module("notPreloaded", [ module ], preloadPromise.result());
            }
            var exports = module.exports;
            setModuleProperty(module, /*PROPERTY_EXECUTING*/ 2, true);
            try {
                getModuleProperty(module, /*PROPERTY_DEFINITION*/ 0).call(exports, module, global);
                setModuleProperty(module, /*PROPERTY_DEFINITION*/ 0, null);
                setModuleProperty(module, /*PROPERTY_DEPENDENCIES*/ 1, null);
                module.loaded = true;
                return module.exports;
            } finally {
                setModuleProperty(module, /*PROPERTY_EXECUTING*/ 2, false);
            }
        };
        contextProto.moduleResolve = function(module, id) {
            return this.resolver.moduleResolve(module, id);
        };
        contextProto.moduleRequire = function(module, id) {
            return this.moduleExecuteSync(this.getModule(this.moduleResolve(module, id)));
        };
        contextProto.getModule = function(moduleFilename) {
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
        contextProto.define = function(moduleFilename, dependencies, body) {
            this.moduleDefine(this.getModule(moduleFilename), dependencies, body);
        };
        contextProto.moduleDefine = function(module, dependencies, body) {
            if (!getModuleProperty(module, /*PROPERTY_DEFINITION*/ 0)) {
                // do not override an existing definition
                setModuleProperty(module, /*PROPERTY_DEFINITION*/ 0, body);
                setModuleProperty(module, /*PROPERTY_DEPENDENCIES*/ 1, dependencies);
                setModuleProperty(module, /*PROPERTY_LOADING_DEFINITION*/ 4, false);
            }
            return module;
        };
        contextProto.moduleExecute = function(module) {
            var self = this;
            return self.modulePreload(module).thenSync(function() {
                return self.moduleExecuteSync(module);
            });
        };
        contextProto.moduleAsyncRequire = function(module, dependencies) {
            return this.modulePreloadDependencies(module, dependencies).thenSync(function() {
                var result = [];
                for (var i = 0, l = dependencies.length; i < l; i++) {
                    var item = dependencies[i];
                    if (/*typeUtils*/ type$module.isString(item)) {
                        result[i] = module.require(item);
                    }
                }
                return result;
            });
        };
        contextProto.jsModuleDefine = function(jsCode, moduleFilename, url) {
            var dependencies = /*findRequires*/ findRequires$module(jsCode, true);
            var body = this.jsModuleEval(jsCode, url || moduleFilename);
            return this.moduleDefine(this.getModule(moduleFilename), dependencies, body);
        };
        contextProto.jsModuleExecute = function(jsCode, moduleFilename, url) {
            return this.moduleExecute(this.jsModuleDefine(jsCode, moduleFilename, url));
        };
        contextProto.jsModuleEval = function(jsCode, url) {
            /*jsEval*/
            return jsEval$module(jsCode, url, "(function(module, global){\nvar require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;\n\n", "\n\n})");
        };
        contextProto.execModuleCall = function(moduleFilename) {
            return this.moduleExecute(this.getModule(this.moduleResolve(this.rootModule, moduleFilename)));
        };
        Context.builtinModules = BuiltinModules.prototype = {
            "/noder-js/asyncRequire.js": function(context) {
                return function(module) {
                    module.exports = context.rootModule.asyncRequire;
                };
            },
            "/noder-js/currentContext.js": function(context) {
                return function(module) {
                    module.exports = context;
                };
            }
        };
        contextProto.Context = Context;
        Context.createContext = function(cfg) {
            return new Context(cfg).rootModule;
        };
        Context.expose = contextProto.expose = function(name, exports) {
            var body = function(module) {
                module.exports = exports;
            };
            this.builtinModules["/" + name] = function() {
                return body;
            };
        };
        context$module = Context;
    })();
        (function() {
        var config = packagedConfig$module().mainContext;
        var src = /*scriptTag*/ scriptTag$module.src;
        if (src) {
            // only read the script config if the script tag has an src attribute
            var configContent = /*scriptTag*/ scriptTag$module.innerHTML;
            if (!/^\s*$/.test(configContent || "")) {
                var scriptConfig = /*exec*/ eval$module(configContent);
                /*merge*/ merge$module(config, scriptConfig, true);
            }
            if (!config.main) {
                var questionMark = src.indexOf("?");
                if (questionMark > -1) {
                    config.main = decodeURIComponent(src.substring(questionMark + 1));
                }
            }
        }
        defaultConfig$module = config;
    })();
    /*Context*/ context$module.expose("noder-js/promise.js", promise$module);
    /*Context*/ context$module.expose("noder-js/context.js", context$module);
    /*Context*/ context$module.expose("noder-js/findRequires.js", findRequires$module);
    /*Context*/ context$module.expose("noder-js/jsEval.js", jsEval$module);
    /*Context*/ context$module.expose("noder-js/request.js", request$module);
    /*Context*/ context$module.expose("noder-js/asyncCall.js", asyncCall$module);
    main$module = /*Context*/ context$module.createContext(/*defaultConfig*/ defaultConfig$module);
    return main$module;
})(function() {
    return this;
}(), function() {
    /*jshint evil:true */
    eval(arguments[0]);
}, function() {
    return {
        mainContext: {
            varName: "noder",
            scriptsType: "application/x-noder"
        },
        errorContext: {
            main: "error.js",
            packaging: {
                baseUrl: "%scriptdir%/noderError/",
                requestConfig: {
                    sync: true
                }
            }
        }
    };
});