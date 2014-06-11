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
var operatorRegExp = /^(\w{2,}|[!%&\(*+,\-\/:;<=>?\[\^])$/;
var firstNonSpaceCharRegExp = /^\s*(\S)/;
var lastNonSpaceCharRegExp = /(\b(return|throw|new|in)|\S)\s*$/;
var pluginBeginRegExp = /\s*\)\s*\.\s*([_$a-zA-Z][_$a-zA-Z0-9]*)\s*\(\s*(?=(.?))/g;
var pluginParamRegExp = /[_$a-zA-Z][_$a-zA-Z0-9]*/g;
var pluginParamSepRegExp = /\s*(\)|,)\s*/g;

var isEscaped = function(string) {
    var escaped = false;
    var index = string.length - 1;
    while (index >= 0 && string.charAt(index) == '\\') {
        index--;
        escaped = !escaped;
    }
    return escaped;
};

var getLastNonSpaceChar = function(array, i) {
    for (; i >= 0; i--) {
        var curItem = array[i];
        if (lastNonSpaceCharRegExp.test(curItem)) {
            return RegExp.$1;
        }
    }
    return "";
};

var checkRequireScope = function(array, i) {
    return i === 0 || getLastNonSpaceChar(array, i - 1) != ".";
};

var isRegExp = function(array, i) {
    return i === 0 || operatorRegExp.test(getLastNonSpaceChar(array, i - 1));
};

var findEndOfStringOrRegExp = function(array, i) {
    var expectedEnd = array[i].charAt(0);
    i++;
    for (var l = array.length; i < l; i++) {
        var item = array[i].charAt(0);
        if (item === expectedEnd) {
            if (!isEscaped(array[i - 1])) {
                break;
            }
        }
    }
    // here, if i == l, the string or regexp has no end (which is not correct in JS...)
    return i;
};

var findEndOfSlashComment = function(array, beginIndex) {
    for (var i = beginIndex + 1, l = array.length; i < l; i++) {
        var curItem = array[i];
        var index = curItem.search(endOfLineRegExp);
        if (index > -1) {
            array[i] = curItem.substring(index);
            break;
        }
    }
    array.splice(beginIndex, i - beginIndex);
    return beginIndex;
};

var findEndOfStarComment = function(array, beginIndex) {
    var i = beginIndex + 1;
    if (array[beginIndex] == "/*") {
        i++;
    }
    var curItem = array[i - 1];
    for (var l = array.length; i < l; i++) {
        var prevItem = curItem;
        curItem = array[i];
        if (prevItem.charAt(prevItem.length - 1) == '*' && curItem.charAt(0) == '/') {
            array[i] = curItem.substring(1);
            break;
        }
    }
    // here, if i == l, the comment has no end (which is not correct in JS...)
    array.splice(beginIndex, i - beginIndex);
    return beginIndex;
};

var parseSource = function(source) {
    var stringsPositions = [];
    var requireStrings = [];
    var i = 0;
    var array = source.split(splitRegExp);
    var l = array.length;
    /*
     * inRequireState variable:
     * 0 : outside of any useful require
     * 1 : just reached require
     * 2 : looking for the string
     * 3 : just reached the string
     * 4 : looking for closing parenthesis
     */
    var inRequireState = -1;

    for (; i < l && i >= 0; i++) {
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
            var beginString = i;
            i = findEndOfStringOrRegExp(array, i);
            stringsPositions.push([beginString, i]);
            if (inRequireState == 2) {
                inRequireState = 3;
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
                        // the last string is the parameter of require
                        requireStrings.push(stringsPositions.length - 1);
                    }
                    inRequireState = 0;
                }
            }
        }
    }
    return [array, stringsPositions, requireStrings];
};

var createPositionsConverter = function(array) {
    var positions = [0];
    for (var i = 1, l = array.length; i <= l; i++) {
        positions[i] = positions[i - 1] + array[i - 1].length;
    }
    return function(pos) {
        return [positions[pos[0]] + 1, positions[pos[1]]];
    };
};

var getString = function(source, position) {
    // TODO: replace special chars: \n \t \\ ...
    return source.substring.apply(source, position);
};

var regExpExecPosition = function(regExp, source, index) {
    regExp.lastIndex = index;
    var match = regExp.exec(source);
    if (match && match.index == index) {
        return match;
    }
};

var isPlugin = /(^|\/)\$[^\/]*$/;
module.exports = function(source, includePlugins) {
    var parseInfo = parseSource(source);
    var requireStrings = parseInfo[2];
    var requireStringsLength = requireStrings.length;
    var depMap = {};
    var res = [];
    if (requireStrings.length) {
        var posConverter = createPositionsConverter(parseInfo[0]);
        var stripComment = parseInfo[0].join('');
        var stringsPositions = parseInfo[1];
        var nbStrings = stringsPositions.length;
        for (var i = 0; i < requireStringsLength; i++) {
            var strIndex = requireStrings[i];
            var strPos = posConverter(stringsPositions[strIndex]);
            var curItem = getString(stripComment, strPos);
            // don't add the dependency more than once
            if (!depMap[curItem]) {
                res.push(curItem);
                depMap[curItem] = true;
            }
            if (includePlugins && isPlugin.test(curItem)) {
                var match = regExpExecPosition(pluginBeginRegExp, stripComment, strPos[1] + 1);
                if (match) {
                    var method = match[1];
                    var args = [];
                    var nextString = ++strIndex < nbStrings && posConverter(stringsPositions[strIndex]);
                    match[1] = match[2];
                    while (match && match[1] != ")") {
                        var curPos = match.index + match[0].length;
                        if (nextString && curPos + 1 === nextString[0]) {
                            args.push(getString(stripComment, nextString));
                            curPos = nextString[1] + 1;
                            nextString = ++strIndex < nbStrings && posConverter(stringsPositions[strIndex]);
                        } else {
                            match = regExpExecPosition(pluginParamRegExp, stripComment, curPos);
                            if (!match) {
                                break;
                            }
                            curPos = pluginParamRegExp.lastIndex;
                            args.push([match[0]]);
                        }
                        match = regExpExecPosition(pluginParamSepRegExp, stripComment, curPos);
                    }
                    if (match) {
                        // this means the call is properly finished with a closing parenthesis
                        res.push({
                            module: curItem,
                            method: method,
                            args: args
                        });
                    }
                }
            }
        }
    }
    return res;
};
