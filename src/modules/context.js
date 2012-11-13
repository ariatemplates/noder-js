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
var Packaging = require('./packaging.js');
var extractDependencies = require('./extractDependencies.js');
var moduleFunction = require('./moduleFunction.js');
var execCallModule = require('./execCallModule.js');
var Resolver = require('./resolver.js');
var execScripts = require('../node-modules/execScripts.js');
var isArray = require('./type.js').isArray;
var dirname = require('./path.js').dirname;

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