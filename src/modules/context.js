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

var Promise = require("./promise.js");
var Loader = require('./loader.js');
var Resolver = require('./resolver.js');
var execScripts = require('../node-modules/execScripts.js');
var typeUtils = require('./type.js');
var noderError = require('./noderError.js');
var dirname = require('./path.js').dirname;
var jsEval = require('./jsEval.js');
var findRequires = require('./findRequires.js');
var bind1 = require('./bind1.js');
var noderPropertiesKey = "_noder";

var PROPERTY_DEFINITION = 0;
var PROPERTY_DEPENDENCIES = 1;
var PROPERTY_EXECUTING = 2;
var PROPERTY_PRELOADING = 3;
var PROPERTY_LOADING_DEFINITION = 4;
var PROPERTY_PRELOADING_PARENTS = 5;

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
        this.dirname = filename = '.';
    }
    this[noderPropertiesKey] = {};
    this.filename = filename;
    this.id = filename;
    this.require = bind1(context.moduleRequire, context, this);
    this.require.resolve = bind1(context.moduleResolve, context, this);
    this.require.cache = context.cache;
    this.require.main = context.main;
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

var start = function(context) {
    var config = context.config;
    var actions = Promise.done;

    var main = config.main;
    actions = actions.thenSync(main ? function() {
        var res = context.main = context.execModuleCall(main);
        return res;
    } : function() {} /* if there is no main module, an empty parameter should be passed to onstart */ );

    actions = actions.thenSync(config.onstart);

    var scriptsType = config.scriptsType;
    if (scriptsType) {
        actions = actions.thenSync(function() {
            return execScripts(context, scriptsType);
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
    this.allSettled = config.failFast === false ? Promise.allSettled : Promise.all;

    var rootModule = new Module(this);
    rootModule.preloaded = true;
    rootModule.loaded = true;
    rootModule.define = this.define = bind(this.define, this);
    rootModule.asyncRequire = createAsyncRequire(this)(rootModule);
    rootModule.execute = bind(this.jsModuleExecute, this);
    rootModule.createContext = Context.createContext;
    this.rootModule = rootModule;

    this.resolver = createInstance(config.Resolver, Resolver, this);
    this.loader = createInstance(config.Loader, Loader, this);

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
    var parents = getModuleProperty(lookInside, PROPERTY_PRELOADING_PARENTS);
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
        return Promise.done;
    }
    var preloading = getModuleProperty(module, PROPERTY_PRELOADING);
    var preloadingParents = getModuleProperty(module, PROPERTY_PRELOADING_PARENTS);
    if (preloading || preloadingParents) {
        // If we get here, it may be because of a circular dependency
        if (parent) {
            if (checkCircularDependency(module, parent)) {
                return Promise.done;
            }
            preloadingParents.push(parent);
        }
        if (!preloading) {
            throw noderError("modulePreloadRec", [module]);
        }
        return preloading;
    }
    var self = this;
    setModuleProperty(module, PROPERTY_PRELOADING_PARENTS, parent ? [parent] : []);
    return setModuleProperty(module, PROPERTY_PRELOADING, self.moduleLoadDefinition(module).thenSync(function() {
        return self.modulePreloadDependencies(module, getModuleProperty(module, PROPERTY_DEPENDENCIES));
    }).thenSync(function() {
        module.preloaded = true;
        setModuleProperty(module, PROPERTY_PRELOADING, false);
        setModuleProperty(module, PROPERTY_PRELOADING_PARENTS, null);
    }, function(error) {
        throw noderError("modulePreload", [module], error);
    }));
};

contextProto.moduleLoadDefinition = function(module) {
    if (getModuleProperty(module, PROPERTY_DEFINITION)) {
        return Promise.done;
    }
    var res = getModuleProperty(module, PROPERTY_LOADING_DEFINITION);
    if (!res) {
        var filename = module.filename;
        var builtin = this.builtinModules["/" + filename];
        if (builtin) {
            this.moduleDefine(module, [], builtin(this));
            res = Promise.done;
        } else {
            var asyncOrError = true;
            var checkResult = function(error) {
                // check that the definition was correctly loaded:
                if (getModuleProperty(module, PROPERTY_DEFINITION)) {
                    asyncOrError = false;
                } else {
                    throw noderError("moduleLoadDefinition", [module], error);
                }
            };
            res = this.loader.moduleLoad(module).thenSync(checkResult, checkResult);
            if (asyncOrError) {
                setModuleProperty(module, PROPERTY_LOADING_DEFINITION, res);
            }
        }
    }
    return res;
};

contextProto.moduleProcessPlugin = function(module, pluginDef) {
    var allowedParameters = {
        "module": module,
        "__dirname": module.dirname,
        "__filename": module.filename,
        "null": null
    };
    var parameters = pluginDef.args.slice(0);
    for (var i = 0, l = parameters.length; i < l; i++) {
        var curParameter = parameters[i];
        if (typeUtils.isArray(curParameter)) {
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
        throw noderError("moduleProcessPlugin", [module, pluginDef], error);
    });
};

contextProto.modulePreloadDependencies = function(module, dependencies) {
    var promises = [];
    for (var i = 0, l = dependencies.length; i < l; i++) {
        var curDependency = dependencies[i];
        var curPromise = typeUtils.isString(curDependency) ?
            this.modulePreload(this.getModule(this.moduleResolve(module, curDependency)), module) :
            this.moduleProcessPlugin(module, curDependency);
        promises.push(curPromise);
    }
    return this.allSettled(promises);
};

contextProto.moduleExecuteSync = function(module) {
    if (module.loaded || getModuleProperty(module, PROPERTY_EXECUTING)) { /* this.executing is true only in the case of a circular dependency */
        return module.exports;
    }
    var preloadPromise = this.modulePreload(module);
    if (!preloadPromise.isFulfilled()) {
        throw noderError("notPreloaded", [module], preloadPromise.result());
    }
    var exports = module.exports;
    setModuleProperty(module, PROPERTY_EXECUTING, true);
    try {
        getModuleProperty(module, PROPERTY_DEFINITION).call(exports, module, global);
        setModuleProperty(module, PROPERTY_DEFINITION, null);
        setModuleProperty(module, PROPERTY_DEPENDENCIES, null);
        module.loaded = true;
        return module.exports;
    } finally {
        setModuleProperty(module, PROPERTY_EXECUTING, false);
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
    if (!getModuleProperty(module, PROPERTY_DEFINITION)) {
        // do not override an existing definition
        setModuleProperty(module, PROPERTY_DEFINITION, body);
        setModuleProperty(module, PROPERTY_DEPENDENCIES, dependencies);
        setModuleProperty(module, PROPERTY_LOADING_DEFINITION, false);
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
            if (typeUtils.isString(item)) {
                result[i] = module.require(item);
            }
        }
        return result;
    });
};

contextProto.jsModuleDefine = function(jsCode, moduleFilename, url) {
    var dependencies = findRequires(jsCode, true);
    var body = this.jsModuleEval(jsCode, url || moduleFilename);
    return this.moduleDefine(this.getModule(moduleFilename), dependencies, body);
};

contextProto.jsModuleExecute = function(jsCode, moduleFilename, url) {
    return this.moduleExecute(this.jsModuleDefine(jsCode, moduleFilename, url));
};

contextProto.jsModuleEval = function(jsCode, url) {
    return jsEval(jsCode, url, '(function(module, global){\nvar require = module.require, exports = module.exports, __filename = module.filename, __dirname = module.dirname;\n\n', '\n\n})');
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
    return (new Context(cfg)).rootModule;
};

Context.expose = contextProto.expose = function(name, exports) {
    var body = function(module) {
        module.exports = exports;
    };
    this.builtinModules["/" + name] = function() {
        return body;
    };
};

module.exports = Context;
