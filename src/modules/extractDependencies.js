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
var firstNonSpaceCharRegExp = /^\s*(\S)/;
var lastNonSpaceCharRegExp = /(\S)\s*$/;

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
        if (lastNonSpaceCharRegExp.test(curItem)) {
            return RegExp.$1;
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
    var curItem = array[i - 1];
    for (var l = array.length; i < l; i++) {
        var prevItem = curItem;
        curItem = array[i];
        if (prevItem.charAt(prevItem.length - 1) == '*' && curItem.charAt(0) == '/') {
            array.splice(beginIndex, i - beginIndex);
            array[beginIndex] = curItem.substring(1);
            return beginIndex;
        }
    }
    return i;
};

module.exports = function (source) {
    var ids = [];
    var i = 0;
    var array = source.split(splitRegExp);
/*
     * inRequireState variable:
     * 0 : outside of any useful require
     * 1 : just reached require
     * 2 : looking for the string
     * 3 : just reached the string
     * 4 : looking for closing parenthesis
     */
    var inRequireState = -1;
    var inRequireBeginString;
    var inRequireEndString;

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
            inRequireBeginString = i;
            i = findEndOfStringOrRegExp(array, i);
            if (inRequireState == 2) {
                inRequireState = 3;
                inRequireEndString = i;
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
                        ids.push(getStringContent(array, inRequireBeginString, inRequireEndString));
                    }
                    inRequireState = 0;
                }
            }
        }
    }
    // Here, array.join('') should exactly contain the source but without comments.
    return ids;
};