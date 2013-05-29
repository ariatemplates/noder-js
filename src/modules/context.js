/*
 * Copyright 2012 Amadeus s.a.s.
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

var promise = require("./promise.js");
var Loader = require('./loader.js');
var exec = require('../node-modules/eval.js');
var execCallModule = require('./execCallModule.js');
var Resolver = require('./resolver.js');
var execScripts = require('../node-modules/execScripts.js');
var typeUtils = require('./type.js');
var isArray = typeUtils.isArray;
var isString = typeUtils.isString;
var isFunction = typeUtils.isFunction;
var dirname = require('./path.js').dirname;
var noderPropertiesKey = "_noder";

var PROPERTY_DEFINITION = 0;
var PROPERTY_DEPENDENCIES = 1;
var PROPERTY_EXECUTING = 2;
var PROPERTY_PRELOADING = 3;
var PROPERTY_LOADING_DEFINITION = 4;

var bind = function(fn, scope) {
    return function() {
        return fn.apply(scope, arguments);
    };
};

var bind1 = function(fn, scope, paramBind) {
    return function(param) {
        return fn.call(scope, paramBind, param);
    };
};

var Module = function(context, filename) {
    if (filename) {
        this.dirname = dirname(filename);
    } else {
        filename = '.';
        this.dirname = filename;
    }
    this[noderPropertiesKey] = {};
    this.filename = filename;
    this.id = filename;
    this.require = bind1(context.moduleRequire, context, this);
    this.require.resolve = bind1(context.moduleResolve, context, this);
    this.require.cache = context.cache;
    this.parent = null;
    this.children = [];
    this.preloaded = false;
    this.loaded = false;
    this.exports = {};
};

var getModuleProperty = function(module, property) {
    return module[noderPropertiesKey][property];
};

var setModuleProperty = function(module, property, value) {
    module[noderPropertiesKey][property] = value;
    return value;
};

var createAsyncRequire = function(context) {
    return function(module) {
        module.exports = {
            create: function(module) {
                return function(id) {
                    return context.moduleAsyncRequire(module, id);
                };
            }
        };
    };
};

var start = function(context) {
    var config = context.config;
    var actions = promise.done;

    if (!("scriptsType" in config)) {
        config.scriptsType = config.varName;
    }
    var scriptsType = config.scriptsType;
    if (scriptsType) {
        actions = actions.then(function() {
            return execScripts(context, scriptsType);
        });
    }

    var main = config.main;
    actions = actions.then(main ? function() {
        return execCallModule(context, main);
    } : promise.empty /* if there is no main module, an empty parameter should be passed to onstart */ );

    actions = actions.then(config.onstart);

    return actions.always(function() {
        context = null;
        config = null;
        actions = null;
    });
};

var createExtPointWrapper = function(context, name, Cstr, defHandler) {
    var current = defHandler || promise.empty;
    if (isFunction(Cstr)) {
        var obj = new Cstr(context, current);
        return bind(obj[name], obj);
    }
    return current;
};

var createLazyExtPointWrapper = function(context, name, moduleName, defHandler, callsList) {
    var initDefHandler = defHandler;
    var loadFct = function() {
        loadFct = null;
        return execCallModule(context, moduleName).then(function(module) {
            context[name] = defHandler = createExtPointWrapper(context, name, module, defHandler);
        }).always(function() {
            var list = callsList;
            callsList = null;
            if (list && initDefHandler != defHandler) {
                for (var i = 0, l = list.length; i < l; i++) {
                    var deferred = promise();
                    deferred.then(defHandler).end();
                    deferred.resolve.apply(null, list[i]);
                }
            }
            initDefHandler = null;
        });
    };
    return function() {
        if (loadFct) {
            promise.done.then(loadFct).end();
        }
        if (callsList) {
            callsList.push(arguments);
        }
        return defHandler.apply(this, arguments);
    };
};

var setExtPoint = function(context, name, Cstr, defValue, callsList) {
    var handler = createExtPointWrapper(context, name, Cstr, context[name]);
    var extPointCfg = context.extPoints[name] || defValue;
    context[name] = (isString(extPointCfg) ? createLazyExtPointWrapper : createExtPointWrapper)(context, name, extPointCfg, handler, callsList);
};

var Context = function(config) {
    config = config || {};
    this.config = config;
    this.cache = {};

    var rootModule = new Module(this);
    rootModule.preloaded = true;
    rootModule.loaded = true;
    rootModule.define = this.define = bind(this.define, this);
    rootModule.asyncRequire = bind1(this.moduleAsyncRequire, this, rootModule);
    rootModule.execute = bind(this.jsModuleExecute, this);
    this.rootModule = rootModule;

    var globalVarName = config.varName;
    if (globalVarName) {
        global[globalVarName] = rootModule;
    }

    this.extPoints = config.extPoints || {};
    setExtPoint(this, "moduleResolve", Resolver);
    setExtPoint(this, "moduleLoad", Loader);
    setExtPoint(this, "jsEvalError", null, "jsEvalError/jsEvalError", []);
    setExtPoint(this, "jsModuleExtractDependencies");

    this.define("asyncRequire.js", [], createAsyncRequire(this));
    start(this).end();
};

var contextProto = Context.prototype = {};

// Preloading a module means making it ready to be executed (loading its definition and preloading its
// dependencies)
contextProto.modulePreload = function(module, parent) {
    if (module.preloaded) {
        return promise.done;
    }
    var preloading = getModuleProperty(module, PROPERTY_PRELOADING);
    if (preloading) {
        // If we get here, it may be because of a circular dependency
        // check it here:
        while (parent) {
            if (parent === module) {
                return promise.done;
            }
            parent = parent.parent;
        }
        return preloading;
    }
    var self = this;
    if (parent && parent.id != '.') {
        module.parent = parent;
        module.require.main = parent.require.main;
        parent.children.push(module);
    } else {
        module.require.main = module;
    }
    return setModuleProperty(module, PROPERTY_PRELOADING, self.moduleLoadDefinition(module).then(function() {
        return self.modulePreloadDependencies(module, getModuleProperty(module, PROPERTY_DEPENDENCIES));
    }).then(function() {
        module.preloaded = true;
        setModuleProperty(module, PROPERTY_PRELOADING, false);
    }).always(function() {
        // clean up
        module = null;
        self = null;
        parent = null;
    }));
};

contextProto.moduleLoadDefinition = function(module) {
    if (getModuleProperty(module, PROPERTY_DEFINITION)) {
        return promise.done;
    }
    var res = getModuleProperty(module, PROPERTY_LOADING_DEFINITION);
    if (!res) {
        // store the promise so that it can be resolved when the define method is called:
        res = setModuleProperty(module, PROPERTY_LOADING_DEFINITION, promise());
        this.moduleLoad(module).always(function(error) {
            // if reaching this, and if res is still pending, then it means the module was not found where expected
            res.reject(error || new Error("Module " + module.filename + " was not found in expected package."));
            res = null;
        });
    }
    return res;
};

contextProto.modulePreloadDependencies = function(module, modules) {
    var promises = [];
    for (var i = 0, l = modules.length; i < l; i++) {
        promises.push(this.modulePreload(this.getModule(this.moduleResolve(module, modules[i])), module));
    }
    return promise.when(promises);
};

contextProto.moduleExecuteSync = function(module) {
    if (module.loaded || getModuleProperty(module, PROPERTY_EXECUTING)) { /* this.executing is true only in the case of a circular dependency */
        return module.exports;
    }
    if (!module.preloaded) {
        throw new Error('A module must be preloaded before executing it.');
    }
    var exports = module.exports;
    setModuleProperty(module, PROPERTY_EXECUTING, true);
    try {
        getModuleProperty(module, PROPERTY_DEFINITION).call(exports, module, global);
        module.loaded = true;
        return module.exports;
    } finally {
        setModuleProperty(module, PROPERTY_EXECUTING, false);
    }
};

contextProto.moduleRequire = function(module, id) {
    var filename = this.moduleResolve(module, id);
    var newModule = this.cache[filename];
    if (newModule) {
        return this.moduleExecuteSync(newModule);
    }
    throw new Error(['Module ', id, ' (', filename, ') is not loaded.'].join(''));
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
    if (!getModuleProperty(module, PROPERTY_DEFINITION)) {
        // do not override an existing definition
        setModuleProperty(module, PROPERTY_DEFINITION, body);
        setModuleProperty(module, PROPERTY_DEPENDENCIES, dependencies);
        var loadingDefinition = getModuleProperty(module, PROPERTY_LOADING_DEFINITION);
        if (loadingDefinition) {
            setModuleProperty(module, PROPERTY_LOADING_DEFINITION, false);
            loadingDefinition.resolve();
        }
    }
    return module;
};

contextProto.moduleExecute = function(module) {
    var self = this;
    return self.modulePreload(module).then(function() {
        return self.moduleExecuteSync(module);
    }).always(function() {
        self = null;
        module = null;
    });
};

contextProto.moduleAsyncRequire = function(module, id) {
    if (isArray(id)) {
        return this.modulePreloadDependencies(module, id);
    } else {
        return this.moduleRequire(module, id);
    }
};

contextProto.jsModuleExtractDependencies = require('./extractDependencies.js');

contextProto.jsModuleDefine = function(jsCode, moduleFilename, url) {
    var dependencies = this.jsModuleExtractDependencies(jsCode);
    var body = this.jsModuleEval(jsCode, url || moduleFilename);
    return this.moduleDefine(this.getModule(moduleFilename), dependencies, body);
};

contextProto.jsModuleExecute = function(jsCode, moduleFilename, url) {
    return this.moduleExecute(this.jsModuleDefine(jsCode, moduleFilename, url));
};

contextProto.jsModuleEval = function(jsCode, url) {
    var code = ['(function(module, global){\nvar require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;\n\n', jsCode, '\n\n})'];
    return this.jsEval(code.join(''), url);
};

contextProto.jsEval = function(jsCode, url) {
    try {
        return exec(jsCode, url);
    } catch (error) {
        this.jsEvalError(jsCode, url, error);
    }
};

contextProto.jsEvalError = function(jsCode, url, error) {
    var newError = new Error((error.message || "error") + " in " + url);
    newError.cause = error;
    newError.fileName = url;
    throw newError;
};

contextProto.Context = Context;

module.exports = Context;
