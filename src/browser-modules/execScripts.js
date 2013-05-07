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

var promise = require('../modules/promise.js');
var domReady = require('./domReady.js');

module.exports = function(context, scriptType) {
    return domReady().then(function() {
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
