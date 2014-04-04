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

module.exports = function(code, fileName) {
    var res = {};
    // Using the 'arguments[1].res = ...' trick because IE does not let eval return a function
    if (fileName) {
        code = ['/*\n * File: ', fileName, '\n */\narguments[1].res=', code, '\n//# sourceURL=', fileName].join('');
    } else {
        code = 'arguments[1].res=' + code;
    }
    callEval(code, res); // callEval is defined outside of any closure
    return res.res;
};
