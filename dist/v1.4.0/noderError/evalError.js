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

var acorn = require("./acorn");

/**
 * Format the error as an error structure with line extract information
 */

function formatError(err, input) {
    var msg = err.message.replace(/\s*\(\d*\:\d*\)\s*$/i, ''); // remove line number / col number

    var bm = ('' + input.slice(0, err.pos)).match(/.*$/i);
    var am = ('' + input.slice(err.pos)).match(/.*/i);
    var before = bm ? bm[0] : '';
    var after = am ? am[0] : '';

    // Prepare line info for txt display
    var cursorPos = before.length;
    var lineStr = before + after;
    var lncursor = [];
    for (var i = 0, sz = lineStr.length; sz > i; i++) {
        lncursor[i] = (i === cursorPos) ? '\u005E' : '-';
    }
    var lineInfoTxt = lineStr + '\n' + lncursor.join('');

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
