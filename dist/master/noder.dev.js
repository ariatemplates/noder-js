/*
 * Noder-js 1.6.1 - 23 Feb 2015
 * https://github.com/ariatemplates/noder-js
 *
 * Copyright 2009-2015 Amadeus s.a.s.
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
                    // Considers 2xx and 304 as a success, anything else as an error
                    // https://github.com/ariatemplates/noder-js/issues/23
                    var status = xhr.status, success = status >= 200 && status < 300 || status == 304;
                    if (success) {
                        fulfill(xhr);
                    } else {
                        reject(/*noderError*/ noderError$module("XMLHttpRequest", [ url, xhr ]));
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
                });
                // the following line must not be part of the previous promises chain because,
                // in the synchronous case, self.currentLoads[url] must have already been assigned
                // (and we should not add useless asynchronism in the chain)
                res.finallySync(function() {
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
            scriptsType: "application/x-noder",
            resolver: {
                "default": {}
            }
        },
        errorContext: {
            main: "noderError/error.js",
            packaging: {
                baseUrl: "",
                requestConfig: null,
                bootstrap: function(define) {
                    define("noderError/error.js", [ "noder-js/asyncRequire", "noder-js/promise" ], function(module, global) {
                        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
                        var asyncRequire = require("noder-js/asyncRequire").create(module);
                        var Promise = require("noder-js/promise");
                        var errorsList = {
                            XMLHttpRequest: function(out, url, xhr) {
                                out.unshift("failed to download '", url, "': ", xhr.status, " ", xhr.statusText, "\n");
                                return Promise.done;
                            },
                            moduleLoadDefinition: function(out, module) {
                                out.unshift("failed to load definition of module '", module.filename, "'\n");
                                return unshiftErrorInfo(this.cause, out);
                            },
                            moduleProcessPlugin: function(out, module, pluginDef) {
                                out.unshift("failed to process plugin require('", pluginDef.module, "')." + pluginDef.method + " for module '", module.filename, "'\n");
                                return unshiftErrorInfo(this.cause, out);
                            },
                            modulePreload: function(out, module) {
                                if (module.filename != ".") {
                                    out.unshift("failed to preload '", module.filename, "'\n");
                                }
                                return unshiftErrorInfo(this.cause, out);
                            },
                            modulePreloadRec: function(out, module) {
                                if (module.filename != ".") {
                                    out.unshift("invalid recursive call to modulePreload '", module.filename, "'\n");
                                }
                                return Promise.done;
                            },
                            notPreloaded: function(out, module) {
                                out.unshift("cannot execute module '", module.filename, "' as it is not preloaded.\n");
                                return this.cause ? unshiftErrorInfo(this.cause, out) : Promise.done;
                            },
                            jsEval: function(out, jsCode, url) {
                                return asyncRequire("./evalError.js").spreadSync(function(evalError) {
                                    var syntaxError = evalError(out, jsCode, url);
                                    if (!syntaxError) {
                                        out.unshift("error while evaluating '" + url + "'\n");
                                        return unshiftErrorInfo(this.cause, out);
                                    }
                                });
                            },
                            resolverRoot: function(out, path) {
                                out.unshift("trying to go upper than the root of modules when resolving '", path.join("/"), "'\n");
                                return Promise.done;
                            },
                            resolverLoop: function(out, path) {
                                out.unshift("inifinite loop when resolving '", path.join("/"), "'\n");
                                return Promise.done;
                            }
                        };
                        var unshiftErrorInfo = function(error, out) {
                            if (error) {
                                if (error.name == "NoderError") {
                                    var code = error.code;
                                    var handler = errorsList[code];
                                    if (handler) {
                                        var params = [ out ].concat(error.args || []);
                                        return handler.apply(error, params);
                                    }
                                } else {
                                    if (error.name && (error.message || error.description)) {
                                        out.unshift(error.name, ": ", error.message || error.description, "\n");
                                    } else {
                                        out.unshift(error + "\n");
                                    }
                                }
                            }
                            return Promise.done;
                        };
                        module.exports = function(error, async) {
                            var out = [];
                            var res = unshiftErrorInfo(error, out).thenSync(function() {
                                var message = out.join("");
                                error.message = error.description = message;
                                if (async) {
                                    console.error("Details about NoderError #" + error.id + ":\n" + message);
                                }
                            });
                            async = true;
                            return res;
                        };
                    });
                    define("noderError/acorn.js", [], function(module, global) {
                        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
                        /** @license
License for acorn.js:

Copyright (C) 2012-2014 by various contributors (see AUTHORS)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

**/
                        // Acorn is a tiny, fast JavaScript parser written in JavaScript.
                        //
                        // Acorn was written by Marijn Haverbeke and various contributors and
                        // released under an MIT license. The Unicode regexps (for identifiers
                        // and whitespace) were taken from [Esprima](http://esprima.org) by
                        // Ariya Hidayat.
                        //
                        // Git repositories for Acorn are available at
                        //
                        //     http://marijnhaverbeke.nl/git/acorn
                        //     https://github.com/marijnh/acorn.git
                        //
                        // Please use the [github bug tracker][ghbt] to report issues.
                        //
                        // [ghbt]: https://github.com/marijnh/acorn/issues
                        //
                        // This file defines the main parser interface. The library also comes
                        // with a [error-tolerant parser][dammit] and an
                        // [abstract syntax tree walker][walk], defined in other files.
                        //
                        // [dammit]: acorn_loose.js
                        // [walk]: util/walk.js
                        (function(root, mod) {
                            if (typeof exports == "object" && typeof module == "object") return mod(exports);
                            // CommonJS
                            if (typeof define == "function" && define.amd) return define([ "exports" ], mod);
                            // AMD
                            mod(root.acorn || (root.acorn = {}));
                        })(this, function(exports) {
                            "use strict";
                            exports.version = "0.11.0";
                            // The main exported interface (under `self.acorn` when in the
                            // browser) is a `parse` function that takes a code string and
                            // returns an abstract syntax tree as specified by [Mozilla parser
                            // API][api], with the caveat that inline XML is not recognized.
                            //
                            // [api]: https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API
                            var options, input, inputLen, sourceFile;
                            exports.parse = function(inpt, opts) {
                                input = String(inpt);
                                inputLen = input.length;
                                setOptions(opts);
                                initTokenState();
                                var startPos = options.locations ? [ tokPos, curPosition() ] : tokPos;
                                initParserState();
                                return parseTopLevel(options.program || startNodeAt(startPos));
                            };
                            // A second optional argument can be given to further configure
                            // the parser process. These options are recognized:
                            var defaultOptions = exports.defaultOptions = {
                                // `ecmaVersion` indicates the ECMAScript version to parse. Must
                                // be either 3, or 5, or 6. This influences support for strict
                                // mode, the set of reserved words, support for getters and
                                // setters and other features.
                                ecmaVersion: 5,
                                // Turn on `strictSemicolons` to prevent the parser from doing
                                // automatic semicolon insertion.
                                strictSemicolons: false,
                                // When `allowTrailingCommas` is false, the parser will not allow
                                // trailing commas in array and object literals.
                                allowTrailingCommas: true,
                                // By default, reserved words are not enforced. Enable
                                // `forbidReserved` to enforce them. When this option has the
                                // value "everywhere", reserved words and keywords can also not be
                                // used as property names.
                                forbidReserved: false,
                                // When enabled, a return at the top level is not considered an
                                // error.
                                allowReturnOutsideFunction: false,
                                // When enabled, import/export statements are not constrained to
                                // appearing at the top of the program.
                                allowImportExportEverywhere: false,
                                // When `locations` is on, `loc` properties holding objects with
                                // `start` and `end` properties in `{line, column}` form (with
                                // line being 1-based and column 0-based) will be attached to the
                                // nodes.
                                locations: false,
                                // A function can be passed as `onToken` option, which will
                                // cause Acorn to call that function with object in the same
                                // format as tokenize() returns. Note that you are not
                                // allowed to call the parser from the callback—that will
                                // corrupt its internal state.
                                onToken: null,
                                // A function can be passed as `onComment` option, which will
                                // cause Acorn to call that function with `(block, text, start,
                                // end)` parameters whenever a comment is skipped. `block` is a
                                // boolean indicating whether this is a block (`/* */`) comment,
                                // `text` is the content of the comment, and `start` and `end` are
                                // character offsets that denote the start and end of the comment.
                                // When the `locations` option is on, two more parameters are
                                // passed, the full `{line, column}` locations of the start and
                                // end of the comments. Note that you are not allowed to call the
                                // parser from the callback—that will corrupt its internal state.
                                onComment: null,
                                // Nodes have their start and end characters offsets recorded in
                                // `start` and `end` properties (directly on the node, rather than
                                // the `loc` object, which holds line/column data. To also add a
                                // [semi-standardized][range] `range` property holding a `[start,
                                // end]` array with the same numbers, set the `ranges` option to
                                // `true`.
                                //
                                // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
                                ranges: false,
                                // It is possible to parse multiple files into a single AST by
                                // passing the tree produced by parsing the first file as
                                // `program` option in subsequent parses. This will add the
                                // toplevel forms of the parsed file to the `Program` (top) node
                                // of an existing parse tree.
                                program: null,
                                // When `locations` is on, you can pass this to record the source
                                // file in every node's `loc` object.
                                sourceFile: null,
                                // This value, if given, is stored in every node, whether
                                // `locations` is on or off.
                                directSourceFile: null,
                                // When enabled, parenthesized expressions are represented by
                                // (non-standard) ParenthesizedExpression nodes
                                preserveParens: false
                            };
                            // This function tries to parse a single expression at a given
                            // offset in a string. Useful for parsing mixed-language formats
                            // that embed JavaScript expressions.
                            exports.parseExpressionAt = function(inpt, pos, opts) {
                                input = String(inpt);
                                inputLen = input.length;
                                setOptions(opts);
                                initTokenState(pos);
                                initParserState();
                                return parseExpression();
                            };
                            var isArray = function(obj) {
                                return Object.prototype.toString.call(obj) === "[object Array]";
                            };
                            function setOptions(opts) {
                                options = {};
                                for (var opt in defaultOptions) options[opt] = opts && has(opts, opt) ? opts[opt] : defaultOptions[opt];
                                sourceFile = options.sourceFile || null;
                                if (isArray(options.onToken)) {
                                    var tokens = options.onToken;
                                    options.onToken = function(token) {
                                        tokens.push(token);
                                    };
                                }
                                if (isArray(options.onComment)) {
                                    var comments = options.onComment;
                                    options.onComment = function(block, text, start, end, startLoc, endLoc) {
                                        var comment = {
                                            type: block ? "Block" : "Line",
                                            value: text,
                                            start: start,
                                            end: end
                                        };
                                        if (options.locations) {
                                            comment.loc = new SourceLocation();
                                            comment.loc.start = startLoc;
                                            comment.loc.end = endLoc;
                                        }
                                        if (options.ranges) comment.range = [ start, end ];
                                        comments.push(comment);
                                    };
                                }
                                isKeyword = options.ecmaVersion >= 6 ? isEcma6Keyword : isEcma5AndLessKeyword;
                            }
                            // The `getLineInfo` function is mostly useful when the
                            // `locations` option is off (for performance reasons) and you
                            // want to find the line/column position for a given character
                            // offset. `input` should be the code string that the offset refers
                            // into.
                            var getLineInfo = exports.getLineInfo = function(input, offset) {
                                for (var line = 1, cur = 0; ;) {
                                    lineBreak.lastIndex = cur;
                                    var match = lineBreak.exec(input);
                                    if (match && match.index < offset) {
                                        ++line;
                                        cur = match.index + match[0].length;
                                    } else break;
                                }
                                return {
                                    line: line,
                                    column: offset - cur
                                };
                            };
                            function Token() {
                                this.type = tokType;
                                this.value = tokVal;
                                this.start = tokStart;
                                this.end = tokEnd;
                                if (options.locations) {
                                    this.loc = new SourceLocation();
                                    this.loc.end = tokEndLoc;
                                    // TODO: remove in next major release
                                    this.startLoc = tokStartLoc;
                                    this.endLoc = tokEndLoc;
                                }
                                if (options.ranges) this.range = [ tokStart, tokEnd ];
                            }
                            exports.Token = Token;
                            // Acorn is organized as a tokenizer and a recursive-descent parser.
                            // The `tokenize` export provides an interface to the tokenizer.
                            // Because the tokenizer is optimized for being efficiently used by
                            // the Acorn parser itself, this interface is somewhat crude and not
                            // very modular. Performing another parse or call to `tokenize` will
                            // reset the internal state, and invalidate existing tokenizers.
                            exports.tokenize = function(inpt, opts) {
                                input = String(inpt);
                                inputLen = input.length;
                                setOptions(opts);
                                initTokenState();
                                skipSpace();
                                function getToken(forceRegexp) {
                                    lastEnd = tokEnd;
                                    readToken(forceRegexp);
                                    return new Token();
                                }
                                getToken.jumpTo = function(pos, reAllowed) {
                                    tokPos = pos;
                                    if (options.locations) {
                                        tokCurLine = 1;
                                        tokLineStart = lineBreak.lastIndex = 0;
                                        var match;
                                        while ((match = lineBreak.exec(input)) && match.index < pos) {
                                            ++tokCurLine;
                                            tokLineStart = match.index + match[0].length;
                                        }
                                    }
                                    tokRegexpAllowed = reAllowed;
                                    skipSpace();
                                };
                                getToken.noRegexp = function() {
                                    tokRegexpAllowed = false;
                                };
                                getToken.options = options;
                                return getToken;
                            };
                            // State is kept in (closure-)global variables. We already saw the
                            // `options`, `input`, and `inputLen` variables above.
                            // The current position of the tokenizer in the input.
                            var tokPos;
                            // The start and end offsets of the current token.
                            var tokStart, tokEnd;
                            // When `options.locations` is true, these hold objects
                            // containing the tokens start and end line/column pairs.
                            var tokStartLoc, tokEndLoc;
                            // The type and value of the current token. Token types are objects,
                            // named by variables against which they can be compared, and
                            // holding properties that describe them (indicating, for example,
                            // the precedence of an infix operator, and the original name of a
                            // keyword token). The kind of value that's held in `tokVal` depends
                            // on the type of the token. For literals, it is the literal value,
                            // for operators, the operator name, and so on.
                            var tokType, tokVal;
                            // Internal state for the tokenizer. To distinguish between division
                            // operators and regular expressions, it remembers whether the last
                            // token was one that is allowed to be followed by an expression.
                            // (If it is, a slash is probably a regexp, if it isn't it's a
                            // division operator. See the `parseStatement` function for a
                            // caveat.)
                            var tokRegexpAllowed;
                            // When `options.locations` is true, these are used to keep
                            // track of the current line, and know when a new line has been
                            // entered.
                            var tokCurLine, tokLineStart;
                            // These store the position of the previous token, which is useful
                            // when finishing a node and assigning its `end` position.
                            var lastStart, lastEnd, lastEndLoc;
                            // This is the parser's state. `inFunction` is used to reject
                            // `return` statements outside of functions, `inGenerator` to
                            // reject `yield`s outside of generators, `labels` to verify
                            // that `break` and `continue` have somewhere to jump to, and
                            // `strict` indicates whether strict mode is on.
                            var inFunction, inGenerator, labels, strict;
                            // This counter is used for checking that arrow expressions did
                            // not contain nested parentheses in argument list.
                            var metParenL;
                            // This is used by the tokenizer to track the template strings it is
                            // inside, and count the amount of open braces seen inside them, to
                            // be able to switch back to a template token when the } to match ${
                            // is encountered. It will hold an array of integers.
                            var templates;
                            function initParserState() {
                                lastStart = lastEnd = tokPos;
                                if (options.locations) lastEndLoc = curPosition();
                                inFunction = inGenerator = strict = false;
                                labels = [];
                                skipSpace();
                                readToken();
                            }
                            // This function is used to raise exceptions on parse errors. It
                            // takes an offset integer (into the current `input`) to indicate
                            // the location of the error, attaches the position to the end
                            // of the error message, and then raises a `SyntaxError` with that
                            // message.
                            function raise(pos, message) {
                                var loc = getLineInfo(input, pos);
                                message += " (" + loc.line + ":" + loc.column + ")";
                                var err = new SyntaxError(message);
                                err.pos = pos;
                                err.loc = loc;
                                err.raisedAt = tokPos;
                                throw err;
                            }
                            // Reused empty array added for node fields that are always empty.
                            var empty = [];
                            // ## Token types
                            // The assignment of fine-grained, information-carrying type objects
                            // allows the tokenizer to store the information it has about a
                            // token in a way that is very cheap for the parser to look up.
                            // All token type variables start with an underscore, to make them
                            // easy to recognize.
                            // These are the general types. The `type` property is only used to
                            // make them recognizeable when debugging.
                            var _num = {
                                type: "num"
                            }, _regexp = {
                                type: "regexp"
                            }, _string = {
                                type: "string"
                            };
                            var _name = {
                                type: "name"
                            }, _eof = {
                                type: "eof"
                            };
                            // Keyword tokens. The `keyword` property (also used in keyword-like
                            // operators) indicates that the token originated from an
                            // identifier-like word, which is used when parsing property names.
                            //
                            // The `beforeExpr` property is used to disambiguate between regular
                            // expressions and divisions. It is set on all token types that can
                            // be followed by an expression (thus, a slash after them would be a
                            // regular expression).
                            //
                            // `isLoop` marks a keyword as starting a loop, which is important
                            // to know when parsing a label, in order to allow or disallow
                            // continue jumps to that label.
                            var _break = {
                                keyword: "break"
                            }, _case = {
                                keyword: "case",
                                beforeExpr: true
                            }, _catch = {
                                keyword: "catch"
                            };
                            var _continue = {
                                keyword: "continue"
                            }, _debugger = {
                                keyword: "debugger"
                            }, _default = {
                                keyword: "default"
                            };
                            var _do = {
                                keyword: "do",
                                isLoop: true
                            }, _else = {
                                keyword: "else",
                                beforeExpr: true
                            };
                            var _finally = {
                                keyword: "finally"
                            }, _for = {
                                keyword: "for",
                                isLoop: true
                            }, _function = {
                                keyword: "function"
                            };
                            var _if = {
                                keyword: "if"
                            }, _return = {
                                keyword: "return",
                                beforeExpr: true
                            }, _switch = {
                                keyword: "switch"
                            };
                            var _throw = {
                                keyword: "throw",
                                beforeExpr: true
                            }, _try = {
                                keyword: "try"
                            }, _var = {
                                keyword: "var"
                            };
                            var _let = {
                                keyword: "let"
                            }, _const = {
                                keyword: "const"
                            };
                            var _while = {
                                keyword: "while",
                                isLoop: true
                            }, _with = {
                                keyword: "with"
                            }, _new = {
                                keyword: "new",
                                beforeExpr: true
                            };
                            var _this = {
                                keyword: "this"
                            };
                            var _class = {
                                keyword: "class"
                            }, _extends = {
                                keyword: "extends",
                                beforeExpr: true
                            };
                            var _export = {
                                keyword: "export"
                            }, _import = {
                                keyword: "import"
                            };
                            var _yield = {
                                keyword: "yield",
                                beforeExpr: true
                            };
                            // The keywords that denote values.
                            var _null = {
                                keyword: "null",
                                atomValue: null
                            }, _true = {
                                keyword: "true",
                                atomValue: true
                            };
                            var _false = {
                                keyword: "false",
                                atomValue: false
                            };
                            // Some keywords are treated as regular operators. `in` sometimes
                            // (when parsing `for`) needs to be tested against specifically, so
                            // we assign a variable name to it for quick comparing.
                            var _in = {
                                keyword: "in",
                                binop: 7,
                                beforeExpr: true
                            };
                            // Map keyword names to token types.
                            var keywordTypes = {
                                "break": _break,
                                "case": _case,
                                "catch": _catch,
                                "continue": _continue,
                                "debugger": _debugger,
                                "default": _default,
                                "do": _do,
                                "else": _else,
                                "finally": _finally,
                                "for": _for,
                                "function": _function,
                                "if": _if,
                                "return": _return,
                                "switch": _switch,
                                "throw": _throw,
                                "try": _try,
                                "var": _var,
                                let: _let,
                                "const": _const,
                                "while": _while,
                                "with": _with,
                                "null": _null,
                                "true": _true,
                                "false": _false,
                                "new": _new,
                                "in": _in,
                                "instanceof": {
                                    keyword: "instanceof",
                                    binop: 7,
                                    beforeExpr: true
                                },
                                "this": _this,
                                "typeof": {
                                    keyword: "typeof",
                                    prefix: true,
                                    beforeExpr: true
                                },
                                "void": {
                                    keyword: "void",
                                    prefix: true,
                                    beforeExpr: true
                                },
                                "delete": {
                                    keyword: "delete",
                                    prefix: true,
                                    beforeExpr: true
                                },
                                "class": _class,
                                "extends": _extends,
                                "export": _export,
                                "import": _import,
                                "yield": _yield
                            };
                            // Punctuation token types. Again, the `type` property is purely for debugging.
                            var _bracketL = {
                                type: "[",
                                beforeExpr: true
                            }, _bracketR = {
                                type: "]"
                            }, _braceL = {
                                type: "{",
                                beforeExpr: true
                            };
                            var _braceR = {
                                type: "}"
                            }, _parenL = {
                                type: "(",
                                beforeExpr: true
                            }, _parenR = {
                                type: ")"
                            };
                            var _comma = {
                                type: ",",
                                beforeExpr: true
                            }, _semi = {
                                type: ";",
                                beforeExpr: true
                            };
                            var _colon = {
                                type: ":",
                                beforeExpr: true
                            }, _dot = {
                                type: "."
                            }, _question = {
                                type: "?",
                                beforeExpr: true
                            };
                            var _arrow = {
                                type: "=>",
                                beforeExpr: true
                            }, _template = {
                                type: "template"
                            }, _templateContinued = {
                                type: "templateContinued"
                            };
                            var _ellipsis = {
                                type: "...",
                                prefix: true,
                                beforeExpr: true
                            };
                            // Operators. These carry several kinds of properties to help the
                            // parser use them properly (the presence of these properties is
                            // what categorizes them as operators).
                            //
                            // `binop`, when present, specifies that this operator is a binary
                            // operator, and will refer to its precedence.
                            //
                            // `prefix` and `postfix` mark the operator as a prefix or postfix
                            // unary operator. `isUpdate` specifies that the node produced by
                            // the operator should be of type UpdateExpression rather than
                            // simply UnaryExpression (`++` and `--`).
                            //
                            // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
                            // binary operators with a very low precedence, that should result
                            // in AssignmentExpression nodes.
                            var _slash = {
                                binop: 10,
                                beforeExpr: true
                            }, _eq = {
                                isAssign: true,
                                beforeExpr: true
                            };
                            var _assign = {
                                isAssign: true,
                                beforeExpr: true
                            };
                            var _incDec = {
                                postfix: true,
                                prefix: true,
                                isUpdate: true
                            }, _prefix = {
                                prefix: true,
                                beforeExpr: true
                            };
                            var _logicalOR = {
                                binop: 1,
                                beforeExpr: true
                            };
                            var _logicalAND = {
                                binop: 2,
                                beforeExpr: true
                            };
                            var _bitwiseOR = {
                                binop: 3,
                                beforeExpr: true
                            };
                            var _bitwiseXOR = {
                                binop: 4,
                                beforeExpr: true
                            };
                            var _bitwiseAND = {
                                binop: 5,
                                beforeExpr: true
                            };
                            var _equality = {
                                binop: 6,
                                beforeExpr: true
                            };
                            var _relational = {
                                binop: 7,
                                beforeExpr: true
                            };
                            var _bitShift = {
                                binop: 8,
                                beforeExpr: true
                            };
                            var _plusMin = {
                                binop: 9,
                                prefix: true,
                                beforeExpr: true
                            };
                            var _modulo = {
                                binop: 10,
                                beforeExpr: true
                            };
                            // '*' may be multiply or have special meaning in ES6
                            var _star = {
                                binop: 10,
                                beforeExpr: true
                            };
                            // Provide access to the token types for external users of the
                            // tokenizer.
                            exports.tokTypes = {
                                bracketL: _bracketL,
                                bracketR: _bracketR,
                                braceL: _braceL,
                                braceR: _braceR,
                                parenL: _parenL,
                                parenR: _parenR,
                                comma: _comma,
                                semi: _semi,
                                colon: _colon,
                                dot: _dot,
                                ellipsis: _ellipsis,
                                question: _question,
                                slash: _slash,
                                eq: _eq,
                                name: _name,
                                eof: _eof,
                                num: _num,
                                regexp: _regexp,
                                string: _string,
                                arrow: _arrow,
                                template: _template,
                                templateContinued: _templateContinued,
                                star: _star,
                                assign: _assign
                            };
                            for (var kw in keywordTypes) exports.tokTypes["_" + kw] = keywordTypes[kw];
                            // This is a trick taken from Esprima. It turns out that, on
                            // non-Chrome browsers, to check whether a string is in a set, a
                            // predicate containing a big ugly `switch` statement is faster than
                            // a regular expression, and on Chrome the two are about on par.
                            // This function uses `eval` (non-lexical) to produce such a
                            // predicate from a space-separated string of words.
                            //
                            // It starts by sorting the words by length.
                            function makePredicate(words) {
                                words = words.split(" ");
                                var f = "", cats = [];
                                out: for (var i = 0; i < words.length; ++i) {
                                    for (var j = 0; j < cats.length; ++j) if (cats[j][0].length == words[i].length) {
                                        cats[j].push(words[i]);
                                        continue out;
                                    }
                                    cats.push([ words[i] ]);
                                }
                                function compareTo(arr) {
                                    if (arr.length == 1) return f += "return str === " + JSON.stringify(arr[0]) + ";";
                                    f += "switch(str){";
                                    for (var i = 0; i < arr.length; ++i) f += "case " + JSON.stringify(arr[i]) + ":";
                                    f += "return true}return false;";
                                }
                                // When there are more than three length categories, an outer
                                // switch first dispatches on the lengths, to save on comparisons.
                                if (cats.length > 3) {
                                    cats.sort(function(a, b) {
                                        return b.length - a.length;
                                    });
                                    f += "switch(str.length){";
                                    for (var i = 0; i < cats.length; ++i) {
                                        var cat = cats[i];
                                        f += "case " + cat[0].length + ":";
                                        compareTo(cat);
                                    }
                                    f += "}";
                                } else {
                                    compareTo(words);
                                }
                                return new Function("str", f);
                            }
                            // The ECMAScript 3 reserved word list.
                            var isReservedWord3 = makePredicate("abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile");
                            // ECMAScript 5 reserved words.
                            var isReservedWord5 = makePredicate("class enum extends super const export import");
                            // The additional reserved words in strict mode.
                            var isStrictReservedWord = makePredicate("implements interface let package private protected public static yield");
                            // The forbidden variable names in strict mode.
                            var isStrictBadIdWord = makePredicate("eval arguments");
                            // And the keywords.
                            var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this";
                            var isEcma5AndLessKeyword = makePredicate(ecma5AndLessKeywords);
                            var isEcma6Keyword = makePredicate(ecma5AndLessKeywords + " let const class extends export import yield");
                            var isKeyword = isEcma5AndLessKeyword;
                            // ## Character categories
                            // Big ugly regular expressions that match characters in the
                            // whitespace, identifier, and identifier-start categories. These
                            // are only applied when a character is found to actually have a
                            // code point above 128.
                            // Generated by `tools/generate-identifier-regex.js`.
                            var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/;
                            var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0-\u08b2\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua7ad\ua7b0\ua7b1\ua7f7-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab5f\uab64\uab65\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";
                            var nonASCIIidentifierChars = "\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08e4-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c03\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d01-\u0d03\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19b0-\u19c0\u19c8\u19c9\u19d0-\u19d9\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1cf8\u1cf9\u1dc0-\u1df5\u1dfc-\u1dff\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8e0-\ua8f1\ua900-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2d\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f";
                            var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
                            var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");
                            // Whether a single character denotes a newline.
                            var newline = /[\n\r\u2028\u2029]/;
                            function isNewLine(code) {
                                return code === 10 || code === 13 || code === 8232 || code == 8233;
                            }
                            // Matches a whole line break (where CRLF is considered a single
                            // line break). Used to count lines.
                            var lineBreak = /\r\n|[\n\r\u2028\u2029]/g;
                            // Test whether a given character code starts an identifier.
                            var isIdentifierStart = exports.isIdentifierStart = function(code) {
                                if (code < 65) return code === 36;
                                if (code < 91) return true;
                                if (code < 97) return code === 95;
                                if (code < 123) return true;
                                return code >= 170 && nonASCIIidentifierStart.test(String.fromCharCode(code));
                            };
                            // Test whether a given character is part of an identifier.
                            var isIdentifierChar = exports.isIdentifierChar = function(code) {
                                if (code < 48) return code === 36;
                                if (code < 58) return true;
                                if (code < 65) return false;
                                if (code < 91) return true;
                                if (code < 97) return code === 95;
                                if (code < 123) return true;
                                return code >= 170 && nonASCIIidentifier.test(String.fromCharCode(code));
                            };
                            // ## Tokenizer
                            // These are used when `options.locations` is on, for the
                            // `tokStartLoc` and `tokEndLoc` properties.
                            function Position(line, col) {
                                this.line = line;
                                this.column = col;
                            }
                            Position.prototype.offset = function(n) {
                                return new Position(this.line, this.column + n);
                            };
                            function curPosition() {
                                return new Position(tokCurLine, tokPos - tokLineStart);
                            }
                            // Reset the token state. Used at the start of a parse.
                            function initTokenState(pos) {
                                if (pos) {
                                    tokPos = pos;
                                    tokLineStart = Math.max(0, input.lastIndexOf("\n", pos));
                                    tokCurLine = input.slice(0, tokLineStart).split(newline).length;
                                } else {
                                    tokCurLine = 1;
                                    tokPos = tokLineStart = 0;
                                }
                                tokRegexpAllowed = true;
                                metParenL = 0;
                                templates = [];
                            }
                            // Called at the end of every token. Sets `tokEnd`, `tokVal`, and
                            // `tokRegexpAllowed`, and skips the space after the token, so that
                            // the next one's `tokStart` will point at the right position.
                            function finishToken(type, val, shouldSkipSpace) {
                                tokEnd = tokPos;
                                if (options.locations) tokEndLoc = curPosition();
                                tokType = type;
                                if (shouldSkipSpace !== false) skipSpace();
                                tokVal = val;
                                tokRegexpAllowed = type.beforeExpr;
                                if (options.onToken) {
                                    options.onToken(new Token());
                                }
                            }
                            function skipBlockComment() {
                                var startLoc = options.onComment && options.locations && curPosition();
                                var start = tokPos, end = input.indexOf("*/", tokPos += 2);
                                if (end === -1) raise(tokPos - 2, "Unterminated comment");
                                tokPos = end + 2;
                                if (options.locations) {
                                    lineBreak.lastIndex = start;
                                    var match;
                                    while ((match = lineBreak.exec(input)) && match.index < tokPos) {
                                        ++tokCurLine;
                                        tokLineStart = match.index + match[0].length;
                                    }
                                }
                                if (options.onComment) options.onComment(true, input.slice(start + 2, end), start, tokPos, startLoc, options.locations && curPosition());
                            }
                            function skipLineComment(startSkip) {
                                var start = tokPos;
                                var startLoc = options.onComment && options.locations && curPosition();
                                var ch = input.charCodeAt(tokPos += startSkip);
                                while (tokPos < inputLen && ch !== 10 && ch !== 13 && ch !== 8232 && ch !== 8233) {
                                    ++tokPos;
                                    ch = input.charCodeAt(tokPos);
                                }
                                if (options.onComment) options.onComment(false, input.slice(start + startSkip, tokPos), start, tokPos, startLoc, options.locations && curPosition());
                            }
                            // Called at the start of the parse and after every token. Skips
                            // whitespace and comments, and.
                            function skipSpace() {
                                while (tokPos < inputLen) {
                                    var ch = input.charCodeAt(tokPos);
                                    if (ch === 32) {
                                        // ' '
                                        ++tokPos;
                                    } else if (ch === 13) {
                                        ++tokPos;
                                        var next = input.charCodeAt(tokPos);
                                        if (next === 10) {
                                            ++tokPos;
                                        }
                                        if (options.locations) {
                                            ++tokCurLine;
                                            tokLineStart = tokPos;
                                        }
                                    } else if (ch === 10 || ch === 8232 || ch === 8233) {
                                        ++tokPos;
                                        if (options.locations) {
                                            ++tokCurLine;
                                            tokLineStart = tokPos;
                                        }
                                    } else if (ch > 8 && ch < 14) {
                                        ++tokPos;
                                    } else if (ch === 47) {
                                        // '/'
                                        var next = input.charCodeAt(tokPos + 1);
                                        if (next === 42) {
                                            // '*'
                                            skipBlockComment();
                                        } else if (next === 47) {
                                            // '/'
                                            skipLineComment(2);
                                        } else break;
                                    } else if (ch === 160) {
                                        // '\xa0'
                                        ++tokPos;
                                    } else if (ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
                                        ++tokPos;
                                    } else {
                                        break;
                                    }
                                }
                            }
                            // ### Token reading
                            // This is the function that is called to fetch the next token. It
                            // is somewhat obscure, because it works in character codes rather
                            // than characters, and because operator parsing has been inlined
                            // into it.
                            //
                            // All in the name of speed.
                            //
                            // The `forceRegexp` parameter is used in the one case where the
                            // `tokRegexpAllowed` trick does not work. See `parseStatement`.
                            function readToken_dot() {
                                var next = input.charCodeAt(tokPos + 1);
                                if (next >= 48 && next <= 57) return readNumber(true);
                                var next2 = input.charCodeAt(tokPos + 2);
                                if (options.ecmaVersion >= 6 && next === 46 && next2 === 46) {
                                    // 46 = dot '.'
                                    tokPos += 3;
                                    return finishToken(_ellipsis);
                                } else {
                                    ++tokPos;
                                    return finishToken(_dot);
                                }
                            }
                            function readToken_slash() {
                                // '/'
                                var next = input.charCodeAt(tokPos + 1);
                                if (tokRegexpAllowed) {
                                    ++tokPos;
                                    return readRegexp();
                                }
                                if (next === 61) return finishOp(_assign, 2);
                                return finishOp(_slash, 1);
                            }
                            function readToken_mult_modulo(code) {
                                // '%*'
                                var next = input.charCodeAt(tokPos + 1);
                                if (next === 61) return finishOp(_assign, 2);
                                return finishOp(code === 42 ? _star : _modulo, 1);
                            }
                            function readToken_pipe_amp(code) {
                                // '|&'
                                var next = input.charCodeAt(tokPos + 1);
                                if (next === code) return finishOp(code === 124 ? _logicalOR : _logicalAND, 2);
                                if (next === 61) return finishOp(_assign, 2);
                                return finishOp(code === 124 ? _bitwiseOR : _bitwiseAND, 1);
                            }
                            function readToken_caret() {
                                // '^'
                                var next = input.charCodeAt(tokPos + 1);
                                if (next === 61) return finishOp(_assign, 2);
                                return finishOp(_bitwiseXOR, 1);
                            }
                            function readToken_plus_min(code) {
                                // '+-'
                                var next = input.charCodeAt(tokPos + 1);
                                if (next === code) {
                                    if (next == 45 && input.charCodeAt(tokPos + 2) == 62 && newline.test(input.slice(lastEnd, tokPos))) {
                                        // A `-->` line comment
                                        skipLineComment(3);
                                        skipSpace();
                                        return readToken();
                                    }
                                    return finishOp(_incDec, 2);
                                }
                                if (next === 61) return finishOp(_assign, 2);
                                return finishOp(_plusMin, 1);
                            }
                            function readToken_lt_gt(code) {
                                // '<>'
                                var next = input.charCodeAt(tokPos + 1);
                                var size = 1;
                                if (next === code) {
                                    size = code === 62 && input.charCodeAt(tokPos + 2) === 62 ? 3 : 2;
                                    if (input.charCodeAt(tokPos + size) === 61) return finishOp(_assign, size + 1);
                                    return finishOp(_bitShift, size);
                                }
                                if (next == 33 && code == 60 && input.charCodeAt(tokPos + 2) == 45 && input.charCodeAt(tokPos + 3) == 45) {
                                    // `<!--`, an XML-style comment that should be interpreted as a line comment
                                    skipLineComment(4);
                                    skipSpace();
                                    return readToken();
                                }
                                if (next === 61) size = input.charCodeAt(tokPos + 2) === 61 ? 3 : 2;
                                return finishOp(_relational, size);
                            }
                            function readToken_eq_excl(code) {
                                // '=!', '=>'
                                var next = input.charCodeAt(tokPos + 1);
                                if (next === 61) return finishOp(_equality, input.charCodeAt(tokPos + 2) === 61 ? 3 : 2);
                                if (code === 61 && next === 62 && options.ecmaVersion >= 6) {
                                    // '=>'
                                    tokPos += 2;
                                    return finishToken(_arrow);
                                }
                                return finishOp(code === 61 ? _eq : _prefix, 1);
                            }
                            function getTokenFromCode(code) {
                                switch (code) {
                                  // The interpretation of a dot depends on whether it is followed
                                    // by a digit or another two dots.
                                    case 46:
                                    // '.'
                                    return readToken_dot();

                                  // Punctuation tokens.
                                    case 40:
                                    ++tokPos;
                                    return finishToken(_parenL);

                                  case 41:
                                    ++tokPos;
                                    return finishToken(_parenR);

                                  case 59:
                                    ++tokPos;
                                    return finishToken(_semi);

                                  case 44:
                                    ++tokPos;
                                    return finishToken(_comma);

                                  case 91:
                                    ++tokPos;
                                    return finishToken(_bracketL);

                                  case 93:
                                    ++tokPos;
                                    return finishToken(_bracketR);

                                  case 123:
                                    ++tokPos;
                                    if (templates.length) ++templates[templates.length - 1];
                                    return finishToken(_braceL);

                                  case 125:
                                    ++tokPos;
                                    if (templates.length && --templates[templates.length - 1] === 0) return readTemplateString(_templateContinued); else return finishToken(_braceR);

                                  case 58:
                                    ++tokPos;
                                    return finishToken(_colon);

                                  case 63:
                                    ++tokPos;
                                    return finishToken(_question);

                                  case 96:
                                    // '`'
                                    if (options.ecmaVersion >= 6) {
                                        ++tokPos;
                                        return readTemplateString(_template);
                                    }

                                  case 48:
                                    // '0'
                                    var next = input.charCodeAt(tokPos + 1);
                                    if (next === 120 || next === 88) return readRadixNumber(16);
                                    // '0x', '0X' - hex number
                                    if (options.ecmaVersion >= 6) {
                                        if (next === 111 || next === 79) return readRadixNumber(8);
                                        // '0o', '0O' - octal number
                                        if (next === 98 || next === 66) return readRadixNumber(2);
                                    }

                                  // Anything else beginning with a digit is an integer, octal
                                    // number, or float.
                                    case 49:
                                  case 50:
                                  case 51:
                                  case 52:
                                  case 53:
                                  case 54:
                                  case 55:
                                  case 56:
                                  case 57:
                                    // 1-9
                                    return readNumber(false);

                                  // Quotes produce strings.
                                    case 34:
                                  case 39:
                                    // '"', "'"
                                    return readString(code);

                                  // Operators are parsed inline in tiny state machines. '=' (61) is
                                    // often referred to. `finishOp` simply skips the amount of
                                    // characters it is given as second argument, and returns a token
                                    // of the type given by its first argument.
                                    case 47:
                                    // '/'
                                    return readToken_slash();

                                  case 37:
                                  case 42:
                                    // '%*'
                                    return readToken_mult_modulo(code);

                                  case 124:
                                  case 38:
                                    // '|&'
                                    return readToken_pipe_amp(code);

                                  case 94:
                                    // '^'
                                    return readToken_caret();

                                  case 43:
                                  case 45:
                                    // '+-'
                                    return readToken_plus_min(code);

                                  case 60:
                                  case 62:
                                    // '<>'
                                    return readToken_lt_gt(code);

                                  case 61:
                                  case 33:
                                    // '=!'
                                    return readToken_eq_excl(code);

                                  case 126:
                                    // '~'
                                    return finishOp(_prefix, 1);
                                }
                                return false;
                            }
                            function readToken(forceRegexp) {
                                if (!forceRegexp) tokStart = tokPos; else tokPos = tokStart + 1;
                                if (options.locations) tokStartLoc = curPosition();
                                if (forceRegexp) return readRegexp();
                                if (tokPos >= inputLen) return finishToken(_eof);
                                var code = input.charCodeAt(tokPos);
                                // Identifier or keyword. '\uXXXX' sequences are allowed in
                                // identifiers, so '\' also dispatches to that.
                                if (isIdentifierStart(code) || code === 92) return readWord();
                                var tok = getTokenFromCode(code);
                                if (tok === false) {
                                    // If we are here, we either found a non-ASCII identifier
                                    // character, or something that's entirely disallowed.
                                    var ch = String.fromCharCode(code);
                                    if (ch === "\\" || nonASCIIidentifierStart.test(ch)) return readWord();
                                    raise(tokPos, "Unexpected character '" + ch + "'");
                                }
                                return tok;
                            }
                            function finishOp(type, size) {
                                var str = input.slice(tokPos, tokPos + size);
                                tokPos += size;
                                finishToken(type, str);
                            }
                            var regexpUnicodeSupport = false;
                            try {
                                new RegExp("\uffff", "u");
                                regexpUnicodeSupport = true;
                            } catch (e) {}
                            // Parse a regular expression. Some context-awareness is necessary,
                            // since a '/' inside a '[]' set does not end the expression.
                            function readRegexp() {
                                var content = "", escaped, inClass, start = tokPos;
                                for (;;) {
                                    if (tokPos >= inputLen) raise(start, "Unterminated regular expression");
                                    var ch = input.charAt(tokPos);
                                    if (newline.test(ch)) raise(start, "Unterminated regular expression");
                                    if (!escaped) {
                                        if (ch === "[") inClass = true; else if (ch === "]" && inClass) inClass = false; else if (ch === "/" && !inClass) break;
                                        escaped = ch === "\\";
                                    } else escaped = false;
                                    ++tokPos;
                                }
                                var content = input.slice(start, tokPos);
                                ++tokPos;
                                // Need to use `readWord1` because '\uXXXX' sequences are allowed
                                // here (don't ask).
                                var mods = readWord1();
                                var tmp = content;
                                if (mods) {
                                    var validFlags = /^[gmsiy]*$/;
                                    if (options.ecmaVersion >= 6) validFlags = /^[gmsiyu]*$/;
                                    if (!validFlags.test(mods)) raise(start, "Invalid regular expression flag");
                                    if (mods.indexOf("u") >= 0 && !regexpUnicodeSupport) {
                                        // Replace each astral symbol and every Unicode code point
                                        // escape sequence that represents such a symbol with a single
                                        // ASCII symbol to avoid throwing on regular expressions that
                                        // are only valid in combination with the `/u` flag.
                                        tmp = tmp.replace(/\\u\{([0-9a-fA-F]{5,6})\}/g, "x").replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "x");
                                    }
                                }
                                // Detect invalid regular expressions.
                                try {
                                    new RegExp(tmp);
                                } catch (e) {
                                    if (e instanceof SyntaxError) raise(start, "Error parsing regular expression: " + e.message);
                                    raise(e);
                                }
                                // Get a regular expression object for this pattern-flag pair, or `null` in
                                // case the current environment doesn't support the flags it uses.
                                try {
                                    var value = new RegExp(content, mods);
                                } catch (err) {
                                    value = null;
                                }
                                return finishToken(_regexp, {
                                    pattern: content,
                                    flags: mods,
                                    value: value
                                });
                            }
                            // Read an integer in the given radix. Return null if zero digits
                            // were read, the integer value otherwise. When `len` is given, this
                            // will return `null` unless the integer has exactly `len` digits.
                            function readInt(radix, len) {
                                var start = tokPos, total = 0;
                                for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
                                    var code = input.charCodeAt(tokPos), val;
                                    if (code >= 97) val = code - 97 + 10; else if (code >= 65) val = code - 65 + 10; else if (code >= 48 && code <= 57) val = code - 48; else val = Infinity;
                                    if (val >= radix) break;
                                    ++tokPos;
                                    total = total * radix + val;
                                }
                                if (tokPos === start || len != null && tokPos - start !== len) return null;
                                return total;
                            }
                            function readRadixNumber(radix) {
                                tokPos += 2;
                                // 0x
                                var val = readInt(radix);
                                if (val == null) raise(tokStart + 2, "Expected number in radix " + radix);
                                if (isIdentifierStart(input.charCodeAt(tokPos))) raise(tokPos, "Identifier directly after number");
                                return finishToken(_num, val);
                            }
                            // Read an integer, octal integer, or floating-point number.
                            function readNumber(startsWithDot) {
                                var start = tokPos, isFloat = false, octal = input.charCodeAt(tokPos) === 48;
                                if (!startsWithDot && readInt(10) === null) raise(start, "Invalid number");
                                if (input.charCodeAt(tokPos) === 46) {
                                    ++tokPos;
                                    readInt(10);
                                    isFloat = true;
                                }
                                var next = input.charCodeAt(tokPos);
                                if (next === 69 || next === 101) {
                                    // 'eE'
                                    next = input.charCodeAt(++tokPos);
                                    if (next === 43 || next === 45) ++tokPos;
                                    // '+-'
                                    if (readInt(10) === null) raise(start, "Invalid number");
                                    isFloat = true;
                                }
                                if (isIdentifierStart(input.charCodeAt(tokPos))) raise(tokPos, "Identifier directly after number");
                                var str = input.slice(start, tokPos), val;
                                if (isFloat) val = parseFloat(str); else if (!octal || str.length === 1) val = parseInt(str, 10); else if (/[89]/.test(str) || strict) raise(start, "Invalid number"); else val = parseInt(str, 8);
                                return finishToken(_num, val);
                            }
                            // Read a string value, interpreting backslash-escapes.
                            function readCodePoint() {
                                var ch = input.charCodeAt(tokPos), code;
                                if (ch === 123) {
                                    if (options.ecmaVersion < 6) unexpected();
                                    ++tokPos;
                                    code = readHexChar(input.indexOf("}", tokPos) - tokPos);
                                    ++tokPos;
                                    if (code > 1114111) unexpected();
                                } else {
                                    code = readHexChar(4);
                                }
                                // UTF-16 Encoding
                                if (code <= 65535) {
                                    return String.fromCharCode(code);
                                }
                                var cu1 = (code - 65536 >> 10) + 55296;
                                var cu2 = (code - 65536 & 1023) + 56320;
                                return String.fromCharCode(cu1, cu2);
                            }
                            function readString(quote) {
                                ++tokPos;
                                var out = "";
                                for (;;) {
                                    if (tokPos >= inputLen) raise(tokStart, "Unterminated string constant");
                                    var ch = input.charCodeAt(tokPos);
                                    if (ch === quote) {
                                        ++tokPos;
                                        return finishToken(_string, out);
                                    }
                                    if (ch === 92) {
                                        // '\'
                                        out += readEscapedChar();
                                    } else {
                                        ++tokPos;
                                        if (newline.test(String.fromCharCode(ch))) {
                                            raise(tokStart, "Unterminated string constant");
                                        }
                                        out += String.fromCharCode(ch);
                                    }
                                }
                            }
                            function readTemplateString(type) {
                                if (type == _templateContinued) templates.pop();
                                var out = "", start = tokPos;
                                for (;;) {
                                    if (tokPos >= inputLen) raise(tokStart, "Unterminated template");
                                    var ch = input.charAt(tokPos);
                                    if (ch === "`" || ch === "$" && input.charCodeAt(tokPos + 1) === 123) {
                                        // '`', '${'
                                        var raw = input.slice(start, tokPos);
                                        ++tokPos;
                                        if (ch == "$") {
                                            ++tokPos;
                                            templates.push(1);
                                        }
                                        return finishToken(type, {
                                            cooked: out,
                                            raw: raw
                                        });
                                    }
                                    if (ch === "\\") {
                                        // '\'
                                        out += readEscapedChar();
                                    } else {
                                        ++tokPos;
                                        if (newline.test(ch)) {
                                            if (ch === "\r" && input.charCodeAt(tokPos) === 10) {
                                                ++tokPos;
                                                ch = "\n";
                                            }
                                            if (options.locations) {
                                                ++tokCurLine;
                                                tokLineStart = tokPos;
                                            }
                                        }
                                        out += ch;
                                    }
                                }
                            }
                            // Used to read escaped characters
                            function readEscapedChar() {
                                var ch = input.charCodeAt(++tokPos);
                                var octal = /^[0-7]+/.exec(input.slice(tokPos, tokPos + 3));
                                if (octal) octal = octal[0];
                                while (octal && parseInt(octal, 8) > 255) octal = octal.slice(0, -1);
                                if (octal === "0") octal = null;
                                ++tokPos;
                                if (octal) {
                                    if (strict) raise(tokPos - 2, "Octal literal in strict mode");
                                    tokPos += octal.length - 1;
                                    return String.fromCharCode(parseInt(octal, 8));
                                } else {
                                    switch (ch) {
                                      case 110:
                                        return "\n";

                                      // 'n' -> '\n'
                                        case 114:
                                        return "\r";

                                      // 'r' -> '\r'
                                        case 120:
                                        return String.fromCharCode(readHexChar(2));

                                      // 'x'
                                        case 117:
                                        return readCodePoint();

                                      // 'u'
                                        case 116:
                                        return "	";

                                      // 't' -> '\t'
                                        case 98:
                                        return "\b";

                                      // 'b' -> '\b'
                                        case 118:
                                        return "";

                                      // 'v' -> '\u000b'
                                        case 102:
                                        return "\f";

                                      // 'f' -> '\f'
                                        case 48:
                                        return "\x00";

                                      // 0 -> '\0'
                                        case 13:
                                        if (input.charCodeAt(tokPos) === 10) ++tokPos;

                                      // '\r\n'
                                        case 10:
                                        // ' \n'
                                        if (options.locations) {
                                            tokLineStart = tokPos;
                                            ++tokCurLine;
                                        }
                                        return "";

                                      default:
                                        return String.fromCharCode(ch);
                                    }
                                }
                            }
                            // Used to read character escape sequences ('\x', '\u', '\U').
                            function readHexChar(len) {
                                var n = readInt(16, len);
                                if (n === null) raise(tokStart, "Bad character escape sequence");
                                return n;
                            }
                            // Used to signal to callers of `readWord1` whether the word
                            // contained any escape sequences. This is needed because words with
                            // escape sequences must not be interpreted as keywords.
                            var containsEsc;
                            // Read an identifier, and return it as a string. Sets `containsEsc`
                            // to whether the word contained a '\u' escape.
                            //
                            // Only builds up the word character-by-character when it actually
                            // containeds an escape, as a micro-optimization.
                            function readWord1() {
                                containsEsc = false;
                                var word, first = true, start = tokPos;
                                for (;;) {
                                    var ch = input.charCodeAt(tokPos);
                                    if (isIdentifierChar(ch)) {
                                        if (containsEsc) word += input.charAt(tokPos);
                                        ++tokPos;
                                    } else if (ch === 92) {
                                        // "\"
                                        if (!containsEsc) word = input.slice(start, tokPos);
                                        containsEsc = true;
                                        if (input.charCodeAt(++tokPos) != 117) // "u"
                                        raise(tokPos, "Expecting Unicode escape sequence \\uXXXX");
                                        ++tokPos;
                                        var esc = readHexChar(4);
                                        var escStr = String.fromCharCode(esc);
                                        if (!escStr) raise(tokPos - 1, "Invalid Unicode escape");
                                        if (!(first ? isIdentifierStart(esc) : isIdentifierChar(esc))) raise(tokPos - 4, "Invalid Unicode escape");
                                        word += escStr;
                                    } else {
                                        break;
                                    }
                                    first = false;
                                }
                                return containsEsc ? word : input.slice(start, tokPos);
                            }
                            // Read an identifier or keyword token. Will check for reserved
                            // words when necessary.
                            function readWord() {
                                var word = readWord1();
                                var type = _name;
                                if (!containsEsc && isKeyword(word)) type = keywordTypes[word];
                                return finishToken(type, word);
                            }
                            // ## Parser
                            // A recursive descent parser operates by defining functions for all
                            // syntactic elements, and recursively calling those, each function
                            // advancing the input stream and returning an AST node. Precedence
                            // of constructs (for example, the fact that `!x[1]` means `!(x[1])`
                            // instead of `(!x)[1]` is handled by the fact that the parser
                            // function that parses unary prefix operators is called first, and
                            // in turn calls the function that parses `[]` subscripts — that
                            // way, it'll receive the node for `x[1]` already parsed, and wraps
                            // *that* in the unary operator node.
                            //
                            // Acorn uses an [operator precedence parser][opp] to handle binary
                            // operator precedence, because it is much more compact than using
                            // the technique outlined above, which uses different, nesting
                            // functions to specify precedence, for all of the ten binary
                            // precedence levels that JavaScript defines.
                            //
                            // [opp]: http://en.wikipedia.org/wiki/Operator-precedence_parser
                            // ### Parser utilities
                            // Continue to the next token.
                            function next() {
                                lastStart = tokStart;
                                lastEnd = tokEnd;
                                lastEndLoc = tokEndLoc;
                                readToken();
                            }
                            // Enter strict mode. Re-reads the next token to please pedantic
                            // tests ("use strict"; 010; -- should fail).
                            function setStrict(strct) {
                                strict = strct;
                                tokPos = tokStart;
                                if (options.locations) {
                                    while (tokPos < tokLineStart) {
                                        tokLineStart = input.lastIndexOf("\n", tokLineStart - 2) + 1;
                                        --tokCurLine;
                                    }
                                }
                                skipSpace();
                                readToken();
                            }
                            // Start an AST node, attaching a start offset.
                            function Node() {
                                this.type = null;
                                this.start = tokStart;
                                this.end = null;
                            }
                            exports.Node = Node;
                            function SourceLocation() {
                                this.start = tokStartLoc;
                                this.end = null;
                                if (sourceFile !== null) this.source = sourceFile;
                            }
                            function startNode() {
                                var node = new Node();
                                if (options.locations) node.loc = new SourceLocation();
                                if (options.directSourceFile) node.sourceFile = options.directSourceFile;
                                if (options.ranges) node.range = [ tokStart, 0 ];
                                return node;
                            }
                            // Sometimes, a node is only started *after* the token stream passed
                            // its start position. The functions below help storing a position
                            // and creating a node from a previous position.
                            function storeCurrentPos() {
                                return options.locations ? [ tokStart, tokStartLoc ] : tokStart;
                            }
                            function startNodeAt(pos) {
                                var node = new Node(), start = pos;
                                if (options.locations) {
                                    node.loc = new SourceLocation();
                                    node.loc.start = start[1];
                                    start = pos[0];
                                }
                                node.start = start;
                                if (options.directSourceFile) node.sourceFile = options.directSourceFile;
                                if (options.ranges) node.range = [ start, 0 ];
                                return node;
                            }
                            // Finish an AST node, adding `type` and `end` properties.
                            function finishNode(node, type) {
                                node.type = type;
                                node.end = lastEnd;
                                if (options.locations) node.loc.end = lastEndLoc;
                                if (options.ranges) node.range[1] = lastEnd;
                                return node;
                            }
                            function finishNodeAt(node, type, pos) {
                                if (options.locations) {
                                    node.loc.end = pos[1];
                                    pos = pos[0];
                                }
                                node.type = type;
                                node.end = pos;
                                if (options.ranges) node.range[1] = pos;
                                return node;
                            }
                            // Test whether a statement node is the string literal `"use strict"`.
                            function isUseStrict(stmt) {
                                return options.ecmaVersion >= 5 && stmt.type === "ExpressionStatement" && stmt.expression.type === "Literal" && stmt.expression.value === "use strict";
                            }
                            // Predicate that tests whether the next token is of the given
                            // type, and if yes, consumes it as a side effect.
                            function eat(type) {
                                if (tokType === type) {
                                    next();
                                    return true;
                                } else {
                                    return false;
                                }
                            }
                            // Test whether a semicolon can be inserted at the current position.
                            function canInsertSemicolon() {
                                return !options.strictSemicolons && (tokType === _eof || tokType === _braceR || newline.test(input.slice(lastEnd, tokStart)));
                            }
                            // Consume a semicolon, or, failing that, see if we are allowed to
                            // pretend that there is a semicolon at this position.
                            function semicolon() {
                                if (!eat(_semi) && !canInsertSemicolon()) unexpected();
                            }
                            // Expect a token of a given type. If found, consume it, otherwise,
                            // raise an unexpected token error.
                            function expect(type) {
                                eat(type) || unexpected();
                            }
                            // Raise an unexpected token error.
                            function unexpected(pos) {
                                raise(pos != null ? pos : tokStart, "Unexpected token");
                            }
                            // Checks if hash object has a property.
                            function has(obj, propName) {
                                return Object.prototype.hasOwnProperty.call(obj, propName);
                            }
                            // Convert existing expression atom to assignable pattern
                            // if possible.
                            function toAssignable(node, allowSpread, checkType) {
                                if (options.ecmaVersion >= 6 && node) {
                                    switch (node.type) {
                                      case "Identifier":
                                      case "MemberExpression":
                                        break;

                                      case "ObjectExpression":
                                        node.type = "ObjectPattern";
                                        for (var i = 0; i < node.properties.length; i++) {
                                            var prop = node.properties[i];
                                            if (prop.kind !== "init") unexpected(prop.key.start);
                                            toAssignable(prop.value, false, checkType);
                                        }
                                        break;

                                      case "ArrayExpression":
                                        node.type = "ArrayPattern";
                                        for (var i = 0, lastI = node.elements.length - 1; i <= lastI; i++) {
                                            toAssignable(node.elements[i], i === lastI, checkType);
                                        }
                                        break;

                                      case "SpreadElement":
                                        if (allowSpread) {
                                            toAssignable(node.argument, false, checkType);
                                            checkSpreadAssign(node.argument);
                                        } else {
                                            unexpected(node.start);
                                        }
                                        break;

                                      default:
                                        if (checkType) unexpected(node.start);
                                    }
                                }
                                return node;
                            }
                            // Checks if node can be assignable spread argument.
                            function checkSpreadAssign(node) {
                                if (node.type !== "Identifier" && node.type !== "ArrayPattern") unexpected(node.start);
                            }
                            // Verify that argument names are not repeated, and it does not
                            // try to bind the words `eval` or `arguments`.
                            function checkFunctionParam(param, nameHash) {
                                switch (param.type) {
                                  case "Identifier":
                                    if (isStrictReservedWord(param.name) || isStrictBadIdWord(param.name)) raise(param.start, "Defining '" + param.name + "' in strict mode");
                                    if (has(nameHash, param.name)) raise(param.start, "Argument name clash in strict mode");
                                    nameHash[param.name] = true;
                                    break;

                                  case "ObjectPattern":
                                    for (var i = 0; i < param.properties.length; i++) checkFunctionParam(param.properties[i].value, nameHash);
                                    break;

                                  case "ArrayPattern":
                                    for (var i = 0; i < param.elements.length; i++) {
                                        var elem = param.elements[i];
                                        if (elem) checkFunctionParam(elem, nameHash);
                                    }
                                    break;
                                }
                            }
                            // Check if property name clashes with already added.
                            // Object/class getters and setters are not allowed to clash —
                            // either with each other or with an init property — and in
                            // strict mode, init properties are also not allowed to be repeated.
                            function checkPropClash(prop, propHash) {
                                if (options.ecmaVersion >= 6) return;
                                var key = prop.key, name;
                                switch (key.type) {
                                  case "Identifier":
                                    name = key.name;
                                    break;

                                  case "Literal":
                                    name = String(key.value);
                                    break;

                                  default:
                                    return;
                                }
                                var kind = prop.kind || "init", other;
                                if (has(propHash, name)) {
                                    other = propHash[name];
                                    var isGetSet = kind !== "init";
                                    if ((strict || isGetSet) && other[kind] || !(isGetSet ^ other.init)) raise(key.start, "Redefinition of property");
                                } else {
                                    other = propHash[name] = {
                                        init: false,
                                        get: false,
                                        set: false
                                    };
                                }
                                other[kind] = true;
                            }
                            // Verify that a node is an lval — something that can be assigned
                            // to.
                            function checkLVal(expr, isBinding) {
                                switch (expr.type) {
                                  case "Identifier":
                                    if (strict && (isStrictBadIdWord(expr.name) || isStrictReservedWord(expr.name))) raise(expr.start, isBinding ? "Binding " + expr.name + " in strict mode" : "Assigning to " + expr.name + " in strict mode");
                                    break;

                                  case "MemberExpression":
                                    if (!isBinding) break;

                                  case "ObjectPattern":
                                    for (var i = 0; i < expr.properties.length; i++) checkLVal(expr.properties[i].value, isBinding);
                                    break;

                                  case "ArrayPattern":
                                    for (var i = 0; i < expr.elements.length; i++) {
                                        var elem = expr.elements[i];
                                        if (elem) checkLVal(elem, isBinding);
                                    }
                                    break;

                                  case "SpreadElement":
                                    break;

                                  default:
                                    raise(expr.start, "Assigning to rvalue");
                                }
                            }
                            // ### Statement parsing
                            // Parse a program. Initializes the parser, reads any number of
                            // statements, and wraps them in a Program node.  Optionally takes a
                            // `program` argument.  If present, the statements will be appended
                            // to its body instead of creating a new node.
                            function parseTopLevel(node) {
                                var first = true;
                                if (!node.body) node.body = [];
                                while (tokType !== _eof) {
                                    var stmt = parseStatement(true);
                                    node.body.push(stmt);
                                    if (first && isUseStrict(stmt)) setStrict(true);
                                    first = false;
                                }
                                lastStart = tokStart;
                                lastEnd = tokEnd;
                                lastEndLoc = tokEndLoc;
                                return finishNode(node, "Program");
                            }
                            var loopLabel = {
                                kind: "loop"
                            }, switchLabel = {
                                kind: "switch"
                            };
                            // Parse a single statement.
                            //
                            // If expecting a statement and finding a slash operator, parse a
                            // regular expression literal. This is to handle cases like
                            // `if (foo) /blah/.exec(foo);`, where looking at the previous token
                            // does not help.
                            function parseStatement(topLevel) {
                                if (tokType === _slash || tokType === _assign && tokVal == "/=") readToken(true);
                                var starttype = tokType, node = startNode();
                                // Most types of statements are recognized by the keyword they
                                // start with. Many are trivial to parse, some require a bit of
                                // complexity.
                                switch (starttype) {
                                  case _break:
                                  case _continue:
                                    return parseBreakContinueStatement(node, starttype.keyword);

                                  case _debugger:
                                    return parseDebuggerStatement(node);

                                  case _do:
                                    return parseDoStatement(node);

                                  case _for:
                                    return parseForStatement(node);

                                  case _function:
                                    return parseFunctionStatement(node);

                                  case _class:
                                    return parseClass(node, true);

                                  case _if:
                                    return parseIfStatement(node);

                                  case _return:
                                    return parseReturnStatement(node);

                                  case _switch:
                                    return parseSwitchStatement(node);

                                  case _throw:
                                    return parseThrowStatement(node);

                                  case _try:
                                    return parseTryStatement(node);

                                  case _var:
                                  case _let:
                                  case _const:
                                    return parseVarStatement(node, starttype.keyword);

                                  case _while:
                                    return parseWhileStatement(node);

                                  case _with:
                                    return parseWithStatement(node);

                                  case _braceL:
                                    return parseBlock();

                                  // no point creating a function for this
                                    case _semi:
                                    return parseEmptyStatement(node);

                                  case _export:
                                  case _import:
                                    if (!topLevel && !options.allowImportExportEverywhere) raise(tokStart, "'import' and 'export' may only appear at the top level");
                                    return starttype === _import ? parseImport(node) : parseExport(node);

                                  // If the statement does not start with a statement keyword or a
                                    // brace, it's an ExpressionStatement or LabeledStatement. We
                                    // simply start parsing an expression, and afterwards, if the
                                    // next token is a colon and the expression was a simple
                                    // Identifier node, we switch to interpreting it as a label.
                                    default:
                                    var maybeName = tokVal, expr = parseExpression();
                                    if (starttype === _name && expr.type === "Identifier" && eat(_colon)) return parseLabeledStatement(node, maybeName, expr); else return parseExpressionStatement(node, expr);
                                }
                            }
                            function parseBreakContinueStatement(node, keyword) {
                                var isBreak = keyword == "break";
                                next();
                                if (eat(_semi) || canInsertSemicolon()) node.label = null; else if (tokType !== _name) unexpected(); else {
                                    node.label = parseIdent();
                                    semicolon();
                                }
                                // Verify that there is an actual destination to break or
                                // continue to.
                                for (var i = 0; i < labels.length; ++i) {
                                    var lab = labels[i];
                                    if (node.label == null || lab.name === node.label.name) {
                                        if (lab.kind != null && (isBreak || lab.kind === "loop")) break;
                                        if (node.label && isBreak) break;
                                    }
                                }
                                if (i === labels.length) raise(node.start, "Unsyntactic " + keyword);
                                return finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement");
                            }
                            function parseDebuggerStatement(node) {
                                next();
                                semicolon();
                                return finishNode(node, "DebuggerStatement");
                            }
                            function parseDoStatement(node) {
                                next();
                                labels.push(loopLabel);
                                node.body = parseStatement();
                                labels.pop();
                                expect(_while);
                                node.test = parseParenExpression();
                                if (options.ecmaVersion >= 6) eat(_semi); else semicolon();
                                return finishNode(node, "DoWhileStatement");
                            }
                            // Disambiguating between a `for` and a `for`/`in` or `for`/`of`
                            // loop is non-trivial. Basically, we have to parse the init `var`
                            // statement or expression, disallowing the `in` operator (see
                            // the second parameter to `parseExpression`), and then check
                            // whether the next token is `in` or `of`. When there is no init
                            // part (semicolon immediately after the opening parenthesis), it
                            // is a regular `for` loop.
                            function parseForStatement(node) {
                                next();
                                labels.push(loopLabel);
                                expect(_parenL);
                                if (tokType === _semi) return parseFor(node, null);
                                if (tokType === _var || tokType === _let) {
                                    var init = startNode(), varKind = tokType.keyword, isLet = tokType === _let;
                                    next();
                                    parseVar(init, true, varKind);
                                    finishNode(init, "VariableDeclaration");
                                    if ((tokType === _in || options.ecmaVersion >= 6 && tokType === _name && tokVal === "of") && init.declarations.length === 1 && !(isLet && init.declarations[0].init)) return parseForIn(node, init);
                                    return parseFor(node, init);
                                }
                                var init = parseExpression(false, true);
                                if (tokType === _in || options.ecmaVersion >= 6 && tokType === _name && tokVal === "of") {
                                    checkLVal(init);
                                    return parseForIn(node, init);
                                }
                                return parseFor(node, init);
                            }
                            function parseFunctionStatement(node) {
                                next();
                                return parseFunction(node, true);
                            }
                            function parseIfStatement(node) {
                                next();
                                node.test = parseParenExpression();
                                node.consequent = parseStatement();
                                node.alternate = eat(_else) ? parseStatement() : null;
                                return finishNode(node, "IfStatement");
                            }
                            function parseReturnStatement(node) {
                                if (!inFunction && !options.allowReturnOutsideFunction) raise(tokStart, "'return' outside of function");
                                next();
                                // In `return` (and `break`/`continue`), the keywords with
                                // optional arguments, we eagerly look for a semicolon or the
                                // possibility to insert one.
                                if (eat(_semi) || canInsertSemicolon()) node.argument = null; else {
                                    node.argument = parseExpression();
                                    semicolon();
                                }
                                return finishNode(node, "ReturnStatement");
                            }
                            function parseSwitchStatement(node) {
                                next();
                                node.discriminant = parseParenExpression();
                                node.cases = [];
                                expect(_braceL);
                                labels.push(switchLabel);
                                // Statements under must be grouped (by label) in SwitchCase
                                // nodes. `cur` is used to keep the node that we are currently
                                // adding statements to.
                                for (var cur, sawDefault; tokType != _braceR; ) {
                                    if (tokType === _case || tokType === _default) {
                                        var isCase = tokType === _case;
                                        if (cur) finishNode(cur, "SwitchCase");
                                        node.cases.push(cur = startNode());
                                        cur.consequent = [];
                                        next();
                                        if (isCase) cur.test = parseExpression(); else {
                                            if (sawDefault) raise(lastStart, "Multiple default clauses");
                                            sawDefault = true;
                                            cur.test = null;
                                        }
                                        expect(_colon);
                                    } else {
                                        if (!cur) unexpected();
                                        cur.consequent.push(parseStatement());
                                    }
                                }
                                if (cur) finishNode(cur, "SwitchCase");
                                next();
                                // Closing brace
                                labels.pop();
                                return finishNode(node, "SwitchStatement");
                            }
                            function parseThrowStatement(node) {
                                next();
                                if (newline.test(input.slice(lastEnd, tokStart))) raise(lastEnd, "Illegal newline after throw");
                                node.argument = parseExpression();
                                semicolon();
                                return finishNode(node, "ThrowStatement");
                            }
                            function parseTryStatement(node) {
                                next();
                                node.block = parseBlock();
                                node.handler = null;
                                if (tokType === _catch) {
                                    var clause = startNode();
                                    next();
                                    expect(_parenL);
                                    clause.param = parseIdent();
                                    if (strict && isStrictBadIdWord(clause.param.name)) raise(clause.param.start, "Binding " + clause.param.name + " in strict mode");
                                    expect(_parenR);
                                    clause.guard = null;
                                    clause.body = parseBlock();
                                    node.handler = finishNode(clause, "CatchClause");
                                }
                                node.guardedHandlers = empty;
                                node.finalizer = eat(_finally) ? parseBlock() : null;
                                if (!node.handler && !node.finalizer) raise(node.start, "Missing catch or finally clause");
                                return finishNode(node, "TryStatement");
                            }
                            function parseVarStatement(node, kind) {
                                next();
                                parseVar(node, false, kind);
                                semicolon();
                                return finishNode(node, "VariableDeclaration");
                            }
                            function parseWhileStatement(node) {
                                next();
                                node.test = parseParenExpression();
                                labels.push(loopLabel);
                                node.body = parseStatement();
                                labels.pop();
                                return finishNode(node, "WhileStatement");
                            }
                            function parseWithStatement(node) {
                                if (strict) raise(tokStart, "'with' in strict mode");
                                next();
                                node.object = parseParenExpression();
                                node.body = parseStatement();
                                return finishNode(node, "WithStatement");
                            }
                            function parseEmptyStatement(node) {
                                next();
                                return finishNode(node, "EmptyStatement");
                            }
                            function parseLabeledStatement(node, maybeName, expr) {
                                for (var i = 0; i < labels.length; ++i) if (labels[i].name === maybeName) raise(expr.start, "Label '" + maybeName + "' is already declared");
                                var kind = tokType.isLoop ? "loop" : tokType === _switch ? "switch" : null;
                                labels.push({
                                    name: maybeName,
                                    kind: kind
                                });
                                node.body = parseStatement();
                                labels.pop();
                                node.label = expr;
                                return finishNode(node, "LabeledStatement");
                            }
                            function parseExpressionStatement(node, expr) {
                                node.expression = expr;
                                semicolon();
                                return finishNode(node, "ExpressionStatement");
                            }
                            // Used for constructs like `switch` and `if` that insist on
                            // parentheses around their expression.
                            function parseParenExpression() {
                                expect(_parenL);
                                var val = parseExpression();
                                expect(_parenR);
                                return val;
                            }
                            // Parse a semicolon-enclosed block of statements, handling `"use
                            // strict"` declarations when `allowStrict` is true (used for
                            // function bodies).
                            function parseBlock(allowStrict) {
                                var node = startNode(), first = true, oldStrict;
                                node.body = [];
                                expect(_braceL);
                                while (!eat(_braceR)) {
                                    var stmt = parseStatement();
                                    node.body.push(stmt);
                                    if (first && allowStrict && isUseStrict(stmt)) {
                                        oldStrict = strict;
                                        setStrict(strict = true);
                                    }
                                    first = false;
                                }
                                if (oldStrict === false) setStrict(false);
                                return finishNode(node, "BlockStatement");
                            }
                            // Parse a regular `for` loop. The disambiguation code in
                            // `parseStatement` will already have parsed the init statement or
                            // expression.
                            function parseFor(node, init) {
                                node.init = init;
                                expect(_semi);
                                node.test = tokType === _semi ? null : parseExpression();
                                expect(_semi);
                                node.update = tokType === _parenR ? null : parseExpression();
                                expect(_parenR);
                                node.body = parseStatement();
                                labels.pop();
                                return finishNode(node, "ForStatement");
                            }
                            // Parse a `for`/`in` and `for`/`of` loop, which are almost
                            // same from parser's perspective.
                            function parseForIn(node, init) {
                                var type = tokType === _in ? "ForInStatement" : "ForOfStatement";
                                next();
                                node.left = init;
                                node.right = parseExpression();
                                expect(_parenR);
                                node.body = parseStatement();
                                labels.pop();
                                return finishNode(node, type);
                            }
                            // Parse a list of variable declarations.
                            function parseVar(node, noIn, kind) {
                                node.declarations = [];
                                node.kind = kind;
                                for (;;) {
                                    var decl = startNode();
                                    decl.id = options.ecmaVersion >= 6 ? toAssignable(parseExprAtom()) : parseIdent();
                                    checkLVal(decl.id, true);
                                    decl.init = eat(_eq) ? parseExpression(true, noIn) : kind === _const.keyword ? unexpected() : null;
                                    node.declarations.push(finishNode(decl, "VariableDeclarator"));
                                    if (!eat(_comma)) break;
                                }
                                return node;
                            }
                            // ### Expression parsing
                            // These nest, from the most general expression type at the top to
                            // 'atomic', nondivisible expression types at the bottom. Most of
                            // the functions will simply let the function(s) below them parse,
                            // and, *if* the syntactic construct they handle is present, wrap
                            // the AST node that the inner parser gave them in another node.
                            // Parse a full expression. The arguments are used to forbid comma
                            // sequences (in argument lists, array literals, or object literals)
                            // or the `in` operator (in for loops initalization expressions).
                            function parseExpression(noComma, noIn) {
                                var start = storeCurrentPos();
                                var expr = parseMaybeAssign(noIn);
                                if (!noComma && tokType === _comma) {
                                    var node = startNodeAt(start);
                                    node.expressions = [ expr ];
                                    while (eat(_comma)) node.expressions.push(parseMaybeAssign(noIn));
                                    return finishNode(node, "SequenceExpression");
                                }
                                return expr;
                            }
                            // Parse an assignment expression. This includes applications of
                            // operators like `+=`.
                            function parseMaybeAssign(noIn) {
                                var start = storeCurrentPos();
                                var left = parseMaybeConditional(noIn);
                                if (tokType.isAssign) {
                                    var node = startNodeAt(start);
                                    node.operator = tokVal;
                                    node.left = tokType === _eq ? toAssignable(left) : left;
                                    checkLVal(left);
                                    next();
                                    node.right = parseMaybeAssign(noIn);
                                    return finishNode(node, "AssignmentExpression");
                                }
                                return left;
                            }
                            // Parse a ternary conditional (`?:`) operator.
                            function parseMaybeConditional(noIn) {
                                var start = storeCurrentPos();
                                var expr = parseExprOps(noIn);
                                if (eat(_question)) {
                                    var node = startNodeAt(start);
                                    node.test = expr;
                                    node.consequent = parseExpression(true);
                                    expect(_colon);
                                    node.alternate = parseExpression(true, noIn);
                                    return finishNode(node, "ConditionalExpression");
                                }
                                return expr;
                            }
                            // Start the precedence parser.
                            function parseExprOps(noIn) {
                                var start = storeCurrentPos();
                                return parseExprOp(parseMaybeUnary(), start, -1, noIn);
                            }
                            // Parse binary operators with the operator precedence parsing
                            // algorithm. `left` is the left-hand side of the operator.
                            // `minPrec` provides context that allows the function to stop and
                            // defer further parser to one of its callers when it encounters an
                            // operator that has a lower precedence than the set it is parsing.
                            function parseExprOp(left, leftStart, minPrec, noIn) {
                                var prec = tokType.binop;
                                if (prec != null && (!noIn || tokType !== _in)) {
                                    if (prec > minPrec) {
                                        var node = startNodeAt(leftStart);
                                        node.left = left;
                                        node.operator = tokVal;
                                        var op = tokType;
                                        next();
                                        var start = storeCurrentPos();
                                        node.right = parseExprOp(parseMaybeUnary(), start, prec, noIn);
                                        finishNode(node, op === _logicalOR || op === _logicalAND ? "LogicalExpression" : "BinaryExpression");
                                        return parseExprOp(node, leftStart, minPrec, noIn);
                                    }
                                }
                                return left;
                            }
                            // Parse unary operators, both prefix and postfix.
                            function parseMaybeUnary() {
                                if (tokType.prefix) {
                                    var node = startNode(), update = tokType.isUpdate, nodeType;
                                    if (tokType === _ellipsis) {
                                        nodeType = "SpreadElement";
                                    } else {
                                        nodeType = update ? "UpdateExpression" : "UnaryExpression";
                                        node.operator = tokVal;
                                        node.prefix = true;
                                    }
                                    tokRegexpAllowed = true;
                                    next();
                                    node.argument = parseMaybeUnary();
                                    if (update) checkLVal(node.argument); else if (strict && node.operator === "delete" && node.argument.type === "Identifier") raise(node.start, "Deleting local variable in strict mode");
                                    return finishNode(node, nodeType);
                                }
                                var start = storeCurrentPos();
                                var expr = parseExprSubscripts();
                                while (tokType.postfix && !canInsertSemicolon()) {
                                    var node = startNodeAt(start);
                                    node.operator = tokVal;
                                    node.prefix = false;
                                    node.argument = expr;
                                    checkLVal(expr);
                                    next();
                                    expr = finishNode(node, "UpdateExpression");
                                }
                                return expr;
                            }
                            // Parse call, dot, and `[]`-subscript expressions.
                            function parseExprSubscripts() {
                                var start = storeCurrentPos();
                                return parseSubscripts(parseExprAtom(), start);
                            }
                            function parseSubscripts(base, start, noCalls) {
                                if (eat(_dot)) {
                                    var node = startNodeAt(start);
                                    node.object = base;
                                    node.property = parseIdent(true);
                                    node.computed = false;
                                    return parseSubscripts(finishNode(node, "MemberExpression"), start, noCalls);
                                } else if (eat(_bracketL)) {
                                    var node = startNodeAt(start);
                                    node.object = base;
                                    node.property = parseExpression();
                                    node.computed = true;
                                    expect(_bracketR);
                                    return parseSubscripts(finishNode(node, "MemberExpression"), start, noCalls);
                                } else if (!noCalls && eat(_parenL)) {
                                    var node = startNodeAt(start);
                                    node.callee = base;
                                    node.arguments = parseExprList(_parenR, false);
                                    return parseSubscripts(finishNode(node, "CallExpression"), start, noCalls);
                                } else if (tokType === _template) {
                                    var node = startNodeAt(start);
                                    node.tag = base;
                                    node.quasi = parseTemplate();
                                    return parseSubscripts(finishNode(node, "TaggedTemplateExpression"), start, noCalls);
                                }
                                return base;
                            }
                            // Parse an atomic expression — either a single token that is an
                            // expression, an expression started by a keyword like `function` or
                            // `new`, or an expression wrapped in punctuation like `()`, `[]`,
                            // or `{}`.
                            function parseExprAtom() {
                                switch (tokType) {
                                  case _this:
                                    var node = startNode();
                                    next();
                                    return finishNode(node, "ThisExpression");

                                  case _yield:
                                    if (inGenerator) return parseYield();

                                  case _name:
                                    var start = storeCurrentPos();
                                    var id = parseIdent(tokType !== _name);
                                    if (eat(_arrow)) {
                                        return parseArrowExpression(startNodeAt(start), [ id ]);
                                    }
                                    return id;

                                  case _regexp:
                                    var node = startNode();
                                    node.regex = {
                                        pattern: tokVal.pattern,
                                        flags: tokVal.flags
                                    };
                                    node.value = tokVal.value;
                                    node.raw = input.slice(tokStart, tokEnd);
                                    next();
                                    return finishNode(node, "Literal");

                                  case _num:
                                  case _string:
                                    var node = startNode();
                                    node.value = tokVal;
                                    node.raw = input.slice(tokStart, tokEnd);
                                    next();
                                    return finishNode(node, "Literal");

                                  case _null:
                                  case _true:
                                  case _false:
                                    var node = startNode();
                                    node.value = tokType.atomValue;
                                    node.raw = tokType.keyword;
                                    next();
                                    return finishNode(node, "Literal");

                                  case _parenL:
                                    var start = storeCurrentPos();
                                    var val, exprList;
                                    next();
                                    // check whether this is generator comprehension or regular expression
                                    if (options.ecmaVersion >= 7 && tokType === _for) {
                                        val = parseComprehension(startNodeAt(start), true);
                                    } else {
                                        var oldParenL = ++metParenL;
                                        if (tokType !== _parenR) {
                                            val = parseExpression();
                                            exprList = val.type === "SequenceExpression" ? val.expressions : [ val ];
                                        } else {
                                            exprList = [];
                                        }
                                        expect(_parenR);
                                        // if '=>' follows '(...)', convert contents to arguments
                                        if (metParenL === oldParenL && eat(_arrow)) {
                                            val = parseArrowExpression(startNodeAt(start), exprList);
                                        } else {
                                            // forbid '()' before everything but '=>'
                                            if (!val) unexpected(lastStart);
                                            // forbid '...' in sequence expressions
                                            if (options.ecmaVersion >= 6) {
                                                for (var i = 0; i < exprList.length; i++) {
                                                    if (exprList[i].type === "SpreadElement") unexpected();
                                                }
                                            }
                                            if (options.preserveParens) {
                                                var par = startNodeAt(start);
                                                par.expression = val;
                                                val = finishNode(par, "ParenthesizedExpression");
                                            }
                                        }
                                    }
                                    return val;

                                  case _bracketL:
                                    var node = startNode();
                                    next();
                                    // check whether this is array comprehension or regular array
                                    if (options.ecmaVersion >= 7 && tokType === _for) {
                                        return parseComprehension(node, false);
                                    }
                                    node.elements = parseExprList(_bracketR, true, true);
                                    return finishNode(node, "ArrayExpression");

                                  case _braceL:
                                    return parseObj();

                                  case _function:
                                    var node = startNode();
                                    next();
                                    return parseFunction(node, false);

                                  case _class:
                                    return parseClass(startNode(), false);

                                  case _new:
                                    return parseNew();

                                  case _template:
                                    return parseTemplate();

                                  default:
                                    unexpected();
                                }
                            }
                            // New's precedence is slightly tricky. It must allow its argument
                            // to be a `[]` or dot subscript expression, but not a call — at
                            // least, not without wrapping it in parentheses. Thus, it uses the
                            function parseNew() {
                                var node = startNode();
                                next();
                                var start = storeCurrentPos();
                                node.callee = parseSubscripts(parseExprAtom(), start, true);
                                if (eat(_parenL)) node.arguments = parseExprList(_parenR, false); else node.arguments = empty;
                                return finishNode(node, "NewExpression");
                            }
                            // Parse template expression.
                            function parseTemplateElement() {
                                var elem = startNodeAt(options.locations ? [ tokStart + 1, tokStartLoc.offset(1) ] : tokStart + 1);
                                elem.value = tokVal;
                                elem.tail = input.charCodeAt(tokEnd - 1) !== 123;
                                // '{'
                                next();
                                var endOff = elem.tail ? 1 : 2;
                                return finishNodeAt(elem, "TemplateElement", options.locations ? [ lastEnd - endOff, lastEndLoc.offset(-endOff) ] : lastEnd - endOff);
                            }
                            function parseTemplate() {
                                var node = startNode();
                                node.expressions = [];
                                var curElt = parseTemplateElement();
                                node.quasis = [ curElt ];
                                while (!curElt.tail) {
                                    node.expressions.push(parseExpression());
                                    if (tokType !== _templateContinued) unexpected();
                                    node.quasis.push(curElt = parseTemplateElement());
                                }
                                return finishNode(node, "TemplateLiteral");
                            }
                            // Parse an object literal.
                            function parseObj() {
                                var node = startNode(), first = true, propHash = {};
                                node.properties = [];
                                next();
                                while (!eat(_braceR)) {
                                    if (!first) {
                                        expect(_comma);
                                        if (options.allowTrailingCommas && eat(_braceR)) break;
                                    } else first = false;
                                    var prop = startNode(), isGenerator;
                                    if (options.ecmaVersion >= 6) {
                                        prop.method = false;
                                        prop.shorthand = false;
                                        isGenerator = eat(_star);
                                    }
                                    parsePropertyName(prop);
                                    if (eat(_colon)) {
                                        prop.value = parseExpression(true);
                                        prop.kind = "init";
                                    } else if (options.ecmaVersion >= 6 && tokType === _parenL) {
                                        prop.kind = "init";
                                        prop.method = true;
                                        prop.value = parseMethod(isGenerator);
                                    } else if (options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" && (prop.key.name === "get" || prop.key.name === "set")) {
                                        if (isGenerator) unexpected();
                                        prop.kind = prop.key.name;
                                        parsePropertyName(prop);
                                        prop.value = parseMethod(false);
                                    } else if (options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
                                        prop.kind = "init";
                                        prop.value = prop.key;
                                        prop.shorthand = true;
                                    } else unexpected();
                                    checkPropClash(prop, propHash);
                                    node.properties.push(finishNode(prop, "Property"));
                                }
                                return finishNode(node, "ObjectExpression");
                            }
                            function parsePropertyName(prop) {
                                if (options.ecmaVersion >= 6) {
                                    if (eat(_bracketL)) {
                                        prop.computed = true;
                                        prop.key = parseExpression();
                                        expect(_bracketR);
                                        return;
                                    } else {
                                        prop.computed = false;
                                    }
                                }
                                prop.key = tokType === _num || tokType === _string ? parseExprAtom() : parseIdent(true);
                            }
                            // Initialize empty function node.
                            function initFunction(node) {
                                node.id = null;
                                node.params = [];
                                if (options.ecmaVersion >= 6) {
                                    node.defaults = [];
                                    node.rest = null;
                                    node.generator = false;
                                }
                            }
                            // Parse a function declaration or literal (depending on the
                            // `isStatement` parameter).
                            function parseFunction(node, isStatement, allowExpressionBody) {
                                initFunction(node);
                                if (options.ecmaVersion >= 6) {
                                    node.generator = eat(_star);
                                }
                                if (isStatement || tokType === _name) {
                                    node.id = parseIdent();
                                }
                                parseFunctionParams(node);
                                parseFunctionBody(node, allowExpressionBody);
                                return finishNode(node, isStatement ? "FunctionDeclaration" : "FunctionExpression");
                            }
                            // Parse object or class method.
                            function parseMethod(isGenerator) {
                                var node = startNode();
                                initFunction(node);
                                parseFunctionParams(node);
                                var allowExpressionBody;
                                if (options.ecmaVersion >= 6) {
                                    node.generator = isGenerator;
                                    allowExpressionBody = true;
                                } else {
                                    allowExpressionBody = false;
                                }
                                parseFunctionBody(node, allowExpressionBody);
                                return finishNode(node, "FunctionExpression");
                            }
                            // Parse arrow function expression with given parameters.
                            function parseArrowExpression(node, params) {
                                initFunction(node);
                                var defaults = node.defaults, hasDefaults = false;
                                for (var i = 0, lastI = params.length - 1; i <= lastI; i++) {
                                    var param = params[i];
                                    if (param.type === "AssignmentExpression" && param.operator === "=") {
                                        hasDefaults = true;
                                        params[i] = param.left;
                                        defaults.push(param.right);
                                    } else {
                                        toAssignable(param, i === lastI, true);
                                        defaults.push(null);
                                        if (param.type === "SpreadElement") {
                                            params.length--;
                                            node.rest = param.argument;
                                            break;
                                        }
                                    }
                                }
                                node.params = params;
                                if (!hasDefaults) node.defaults = [];
                                parseFunctionBody(node, true);
                                return finishNode(node, "ArrowFunctionExpression");
                            }
                            // Parse function parameters.
                            function parseFunctionParams(node) {
                                var defaults = [], hasDefaults = false;
                                expect(_parenL);
                                for (;;) {
                                    if (eat(_parenR)) {
                                        break;
                                    } else if (options.ecmaVersion >= 6 && eat(_ellipsis)) {
                                        node.rest = toAssignable(parseExprAtom(), false, true);
                                        checkSpreadAssign(node.rest);
                                        expect(_parenR);
                                        defaults.push(null);
                                        break;
                                    } else {
                                        node.params.push(options.ecmaVersion >= 6 ? toAssignable(parseExprAtom(), false, true) : parseIdent());
                                        if (options.ecmaVersion >= 6) {
                                            if (eat(_eq)) {
                                                hasDefaults = true;
                                                defaults.push(parseExpression(true));
                                            } else {
                                                defaults.push(null);
                                            }
                                        }
                                        if (!eat(_comma)) {
                                            expect(_parenR);
                                            break;
                                        }
                                    }
                                }
                                if (hasDefaults) node.defaults = defaults;
                            }
                            // Parse function body and check parameters.
                            function parseFunctionBody(node, allowExpression) {
                                var isExpression = allowExpression && tokType !== _braceL;
                                if (isExpression) {
                                    node.body = parseExpression(true);
                                    node.expression = true;
                                } else {
                                    // Start a new scope with regard to labels and the `inFunction`
                                    // flag (restore them to their old value afterwards).
                                    var oldInFunc = inFunction, oldInGen = inGenerator, oldLabels = labels;
                                    inFunction = true;
                                    inGenerator = node.generator;
                                    labels = [];
                                    node.body = parseBlock(true);
                                    node.expression = false;
                                    inFunction = oldInFunc;
                                    inGenerator = oldInGen;
                                    labels = oldLabels;
                                }
                                // If this is a strict mode function, verify that argument names
                                // are not repeated, and it does not try to bind the words `eval`
                                // or `arguments`.
                                if (strict || !isExpression && node.body.body.length && isUseStrict(node.body.body[0])) {
                                    var nameHash = {};
                                    if (node.id) checkFunctionParam(node.id, {});
                                    for (var i = 0; i < node.params.length; i++) checkFunctionParam(node.params[i], nameHash);
                                    if (node.rest) checkFunctionParam(node.rest, nameHash);
                                }
                            }
                            // Parse a class declaration or literal (depending on the
                            // `isStatement` parameter).
                            function parseClass(node, isStatement) {
                                next();
                                node.id = tokType === _name ? parseIdent() : isStatement ? unexpected() : null;
                                node.superClass = eat(_extends) ? parseExpression() : null;
                                var classBody = startNode();
                                classBody.body = [];
                                expect(_braceL);
                                while (!eat(_braceR)) {
                                    var method = startNode();
                                    if (tokType === _name && tokVal === "static") {
                                        next();
                                        method["static"] = true;
                                    } else {
                                        method["static"] = false;
                                    }
                                    var isGenerator = eat(_star);
                                    parsePropertyName(method);
                                    if (tokType !== _parenL && !method.computed && method.key.type === "Identifier" && (method.key.name === "get" || method.key.name === "set")) {
                                        if (isGenerator) unexpected();
                                        method.kind = method.key.name;
                                        parsePropertyName(method);
                                    } else {
                                        method.kind = "";
                                    }
                                    method.value = parseMethod(isGenerator);
                                    classBody.body.push(finishNode(method, "MethodDefinition"));
                                    eat(_semi);
                                }
                                node.body = finishNode(classBody, "ClassBody");
                                return finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression");
                            }
                            // Parses a comma-separated list of expressions, and returns them as
                            // an array. `close` is the token type that ends the list, and
                            // `allowEmpty` can be turned on to allow subsequent commas with
                            // nothing in between them to be parsed as `null` (which is needed
                            // for array literals).
                            function parseExprList(close, allowTrailingComma, allowEmpty) {
                                var elts = [], first = true;
                                while (!eat(close)) {
                                    if (!first) {
                                        expect(_comma);
                                        if (allowTrailingComma && options.allowTrailingCommas && eat(close)) break;
                                    } else first = false;
                                    if (allowEmpty && tokType === _comma) elts.push(null); else elts.push(parseExpression(true));
                                }
                                return elts;
                            }
                            // Parse the next token as an identifier. If `liberal` is true (used
                            // when parsing properties), it will also convert keywords into
                            // identifiers.
                            function parseIdent(liberal) {
                                var node = startNode();
                                if (liberal && options.forbidReserved == "everywhere") liberal = false;
                                if (tokType === _name) {
                                    if (!liberal && (options.forbidReserved && (options.ecmaVersion === 3 ? isReservedWord3 : isReservedWord5)(tokVal) || strict && isStrictReservedWord(tokVal)) && input.slice(tokStart, tokEnd).indexOf("\\") == -1) raise(tokStart, "The keyword '" + tokVal + "' is reserved");
                                    node.name = tokVal;
                                } else if (liberal && tokType.keyword) {
                                    node.name = tokType.keyword;
                                } else {
                                    unexpected();
                                }
                                tokRegexpAllowed = false;
                                next();
                                return finishNode(node, "Identifier");
                            }
                            // Parses module export declaration.
                            function parseExport(node) {
                                next();
                                // export var|const|let|function|class ...;
                                if (tokType === _var || tokType === _const || tokType === _let || tokType === _function || tokType === _class) {
                                    node.declaration = parseStatement();
                                    node["default"] = false;
                                    node.specifiers = null;
                                    node.source = null;
                                } else // export default ...;
                                if (eat(_default)) {
                                    node.declaration = parseExpression(true);
                                    node["default"] = true;
                                    node.specifiers = null;
                                    node.source = null;
                                    semicolon();
                                } else {
                                    // export * from '...';
                                    // export { x, y as z } [from '...'];
                                    var isBatch = tokType === _star;
                                    node.declaration = null;
                                    node["default"] = false;
                                    node.specifiers = parseExportSpecifiers();
                                    if (tokType === _name && tokVal === "from") {
                                        next();
                                        node.source = tokType === _string ? parseExprAtom() : unexpected();
                                    } else {
                                        if (isBatch) unexpected();
                                        node.source = null;
                                    }
                                    semicolon();
                                }
                                return finishNode(node, "ExportDeclaration");
                            }
                            // Parses a comma-separated list of module exports.
                            function parseExportSpecifiers() {
                                var nodes = [], first = true;
                                if (tokType === _star) {
                                    // export * from '...'
                                    var node = startNode();
                                    next();
                                    nodes.push(finishNode(node, "ExportBatchSpecifier"));
                                } else {
                                    // export { x, y as z } [from '...']
                                    expect(_braceL);
                                    while (!eat(_braceR)) {
                                        if (!first) {
                                            expect(_comma);
                                            if (options.allowTrailingCommas && eat(_braceR)) break;
                                        } else first = false;
                                        var node = startNode();
                                        node.id = parseIdent(tokType === _default);
                                        if (tokType === _name && tokVal === "as") {
                                            next();
                                            node.name = parseIdent(true);
                                        } else {
                                            node.name = null;
                                        }
                                        nodes.push(finishNode(node, "ExportSpecifier"));
                                    }
                                }
                                return nodes;
                            }
                            // Parses import declaration.
                            function parseImport(node) {
                                next();
                                // import '...';
                                if (tokType === _string) {
                                    node.specifiers = [];
                                    node.source = parseExprAtom();
                                    node.kind = "";
                                } else {
                                    node.specifiers = parseImportSpecifiers();
                                    if (tokType !== _name || tokVal !== "from") unexpected();
                                    next();
                                    node.source = tokType === _string ? parseExprAtom() : unexpected();
                                }
                                semicolon();
                                return finishNode(node, "ImportDeclaration");
                            }
                            // Parses a comma-separated list of module imports.
                            function parseImportSpecifiers() {
                                var nodes = [], first = true;
                                if (tokType === _name) {
                                    // import defaultObj, { x, y as z } from '...'
                                    var node = startNode();
                                    node.id = parseIdent();
                                    checkLVal(node.id, true);
                                    node.name = null;
                                    node["default"] = true;
                                    nodes.push(finishNode(node, "ImportSpecifier"));
                                    if (!eat(_comma)) return nodes;
                                }
                                if (tokType === _star) {
                                    var node = startNode();
                                    next();
                                    if (tokType !== _name || tokVal !== "as") unexpected();
                                    next();
                                    node.name = parseIdent();
                                    checkLVal(node.name, true);
                                    nodes.push(finishNode(node, "ImportBatchSpecifier"));
                                    return nodes;
                                }
                                expect(_braceL);
                                while (!eat(_braceR)) {
                                    if (!first) {
                                        expect(_comma);
                                        if (options.allowTrailingCommas && eat(_braceR)) break;
                                    } else first = false;
                                    var node = startNode();
                                    node.id = parseIdent(true);
                                    if (tokType === _name && tokVal === "as") {
                                        next();
                                        node.name = parseIdent();
                                    } else {
                                        node.name = null;
                                    }
                                    checkLVal(node.name || node.id, true);
                                    node["default"] = false;
                                    nodes.push(finishNode(node, "ImportSpecifier"));
                                }
                                return nodes;
                            }
                            // Parses yield expression inside generator.
                            function parseYield() {
                                var node = startNode();
                                next();
                                if (eat(_semi) || canInsertSemicolon()) {
                                    node.delegate = false;
                                    node.argument = null;
                                } else {
                                    node.delegate = eat(_star);
                                    node.argument = parseExpression(true);
                                }
                                return finishNode(node, "YieldExpression");
                            }
                            // Parses array and generator comprehensions.
                            function parseComprehension(node, isGenerator) {
                                node.blocks = [];
                                while (tokType === _for) {
                                    var block = startNode();
                                    next();
                                    expect(_parenL);
                                    block.left = toAssignable(parseExprAtom());
                                    checkLVal(block.left, true);
                                    if (tokType !== _name || tokVal !== "of") unexpected();
                                    next();
                                    // `of` property is here for compatibility with Esprima's AST
                                    // which also supports deprecated [for (... in ...) expr]
                                    block.of = true;
                                    block.right = parseExpression();
                                    expect(_parenR);
                                    node.blocks.push(finishNode(block, "ComprehensionBlock"));
                                }
                                node.filter = eat(_if) ? parseParenExpression() : null;
                                node.body = parseExpression();
                                expect(isGenerator ? _parenR : _bracketR);
                                node.generator = isGenerator;
                                return finishNode(node, "ComprehensionExpression");
                            }
                        });
                    });
                    define("noderError/evalError.js", [ "./acorn" ], function(module, global) {
                        var require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;
                        var acorn = require("./acorn");
                        /**
 * Format the error as an error structure with line extract information
 */
                        function formatError(err, input) {
                            var msg = err.message.replace(/\s*\(\d*\:\d*\)\s*$/i, "");
                            // remove line number / col number
                            var bm = ("" + input.slice(0, err.pos)).match(/.*$/i);
                            var am = ("" + input.slice(err.pos)).match(/.*/i);
                            var before = bm ? bm[0] : "";
                            var after = am ? am[0] : "";
                            // Prepare line info for txt display
                            var cursorPos = before.length;
                            var lineStr = before + after;
                            var lncursor = [];
                            for (var i = 0, sz = lineStr.length; sz > i; i++) {
                                lncursor[i] = i === cursorPos ? "^" : "-";
                            }
                            var lineInfoTxt = lineStr + "\n" + lncursor.join("");
                            return {
                                description: msg,
                                lineInfoTxt: lineInfoTxt,
                                code: lineStr,
                                line: err.loc ? err.loc.line : -1,
                                column: err.loc ? err.loc.column : -1
                            };
                        }
                        module.exports = function(out, sourceCode, url) {
                            try {
                                acorn.parse(sourceCode, {
                                    ecmaVersion: 3,
                                    strictSemicolons: false,
                                    allowTrailingCommas: false,
                                    forbidReserved: true
                                });
                            } catch (ex) {
                                var errorInfo = formatError(ex, sourceCode);
                                out.unshift(errorInfo.description, " in '", url, "' (line ", errorInfo.line, ", column ", errorInfo.column, "): \n", errorInfo.lineInfoTxt, "\n");
                                return true;
                            }
                            return false;
                        };
                    });
                }
            }
        }
    };
});