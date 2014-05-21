/*
 * Copyright 2013 Amadeus s.a.s.
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

var yaml = require("js-yaml");
var hljs = require("highlight.js");
var yamlHeaderRegExp = /^([\s\S]*?)\n\s*\-+\s*\n/;
var pkg = require("../package.json");

hljs.configure({
    classPrefix: ""
});

exports.highlight = function(content, language) {
    if (language) {
        return hljs.highlight(language, content).value;
    } else {
        return content;
    }
};

exports.preCompile = function(src, context) {
    context.title = "";
    context.page = "";
    var match = yamlHeaderRegExp.exec(src);
    if (match) {
        var yamlHeader;
        src = src.substr(match[0].length);
        try {
            yamlHeader = yaml.safeLoad(match[1]);
        } catch (e) {
            throw new Error("Invalid yaml header");
        }
        Object.keys(yamlHeader).forEach(function(key) {
            context[key] = yamlHeader[key];
        });
    }
    return src.replace(/\(([^()]*)\.md\)/g, "($1.html)");
};

exports.postCompile = function(src) {
    var tmp = src;
    tmp = tmp.replace(/<pre><code/g, "<div class='snippet'><pre><code");
    tmp = tmp.replace(/<\/code><\/pre>/g, "</code></pre></div>");
    tmp = tmp.replace(/\%NODERJSVERSION\%/g, pkg.version);
    return tmp;
};
