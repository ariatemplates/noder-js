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

var Context = require('./context.js');
var defaultConfig = require('../node-modules/defaultConfig.js');

Context.expose('noder-js/promise.js', require('./promise.js'));
Context.expose('noder-js/context.js', require('./context.js'));
Context.expose('noder-js/findRequires.js', require('./findRequires.js'));
Context.expose('noder-js/jsEval.js', require('./jsEval.js'));
Context.expose('noder-js/request.js', require('../node-modules/request.js'));
Context.expose('noder-js/asyncCall.js', require('./asyncCall.js'));

module.exports = Context.createContext(defaultConfig);
