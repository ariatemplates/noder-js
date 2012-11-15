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

var splitRegExp = /(?=[\/'"]|\brequire\s*\()/;
var requireRegExp = /^require\s*\(\s*$/;
var endOfLineRegExp = /[\r\n]/;
var quoteRegExp = /^['"]$/;
var operatorRegExp = /^[!%&\(*+,\-\/:;<=>?\[\^]$/;
var lastNonSpaceCharRegExp = /\S\s*$/;

var isEscaped = function (string) {
    var escaped = false;
    var index = string.length - 1;
    while (index >= 0 && string.charAt(index) == '\\') {
        index--;
        escaped = !escaped;
    }
    return escaped;
};

var getLastNonSpaceChar = function (array, i) {
    for (; i >= 0; i--) {
        var curItem = array[i];
        var index = curItem.search(lastNonSpaceCharRegExp);
        if (index > -1) {
            return curItem.charAt(index);
        }
    }
    return "";
};

var checkRequireScope = function (array, i) {
    return i === 0 || getLastNonSpaceChar(array, i - 1) != ".";
};

var isRegExp = function (array, i) {
    return i === 0 || operatorRegExp.test(getLastNonSpaceChar(array, i - 1));
};

var findEndOfStringOrRegExp = function (array, i) {
    var expectedEnd = array[i].charAt(0);
    i++;
    for (var l = array.length; i < l; i++) {
        var item = array[i].charAt(0);
        if (item === expectedEnd) {
            if (!isEscaped(array[i - 1])) {
                return i;
            }
        }
    }
    throw new Error("Unterminated string or regexp.");
};

var getStringContent = function (array, begin, end) {
    // The string is supposed not to contain any special things such as: \n \r \t \' \"
    return array.slice(begin, end).join('').substring(1);
};

var findEndOfSlashComment = function (array, beginIndex) {
    for (var i = beginIndex + 1, l = array.length; i < l; i++) {
        var curItem = array[i];
        var index = curItem.search(endOfLineRegExp);
        if (index > -1) {
            array[i] = curItem.substring(index);
            array.splice(beginIndex, i - beginIndex);
            return beginIndex;
        }
    }
    return i;
};

var findEndOfStarComment = function (array, beginIndex) {
    var i = beginIndex + 1;
    if (array[beginIndex] == "/*") {
        i++;
    }
    for (var l = array.length; i < l; i++) {
        var prevItem = array[i - 1];
        if (prevItem.charAt(prevItem.length - 1) == '*' && array[i].charAt(0) == '/') {
            array.splice(beginIndex, i + 1 - beginIndex);
            return beginIndex - 1;
        }
    }
    return i;
};

module.exports = function (source) {
    var ids = [];
    var i = 0;
    var array = source.split(splitRegExp);
    for (var l = array.length; i < l && i >= 0; i++) {
        var curItem = array[i];
        var firstChar = curItem.charAt(0);
        if (firstChar == '/') {
            // it may be a comment, a division or a regular expression
            if (curItem == '/' && i + 1 < l && array[i + 1].charAt(0) == '/') {
                i = findEndOfSlashComment(array, i);
                l = array.length; // when processing comments, the array is changed
            } else if (curItem.charAt(1) == "*") {
                i = findEndOfStarComment(array, i);
                l = array.length; // when processing comments, the array is changed
            } else if (isRegExp(array, i)) {
                i = findEndOfStringOrRegExp(array, i);
            }
        } else if (quoteRegExp.test(firstChar)) {
            i = findEndOfStringOrRegExp(array, i);
        } else if (firstChar == "r") {
            if (requireRegExp.test(curItem) && i + 2 < l && checkRequireScope(array, i)) {
                var newI = i + 1;
                if (quoteRegExp.test(array[newI].charAt(0))) {
                    i = findEndOfStringOrRegExp(array, newI);
                    ids.push(getStringContent(array, newI, i));
                }
            }
        }
    }
    return ids;
};