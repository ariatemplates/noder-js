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

module.exports = function(context, mainModule) {
    var startMainMethodParams = mainModule.indexOf('(');
    if (startMainMethodParams > -1) {
        var startMainMethodName = mainModule.lastIndexOf('/', startMainMethodParams);
        if (startMainMethodName < 0) {
            throw new Error("Invalid module call: " + mainModule);
        }
        var methodNameAndArgs = mainModule.substring(startMainMethodName + 1);
        mainModule = mainModule.substring(0, startMainMethodName);
        return context.jsModuleExecute(['module.exports = require("', mainModule, '");\nmodule.exports.', methodNameAndArgs].join(''));
    } else {
        mainModule = context.moduleResolve(context.rootModule, mainModule);
        return context.moduleExecute(context.getModule(mainModule));
    }
};
