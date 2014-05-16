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
var yamlHeaderRegExp = /^([\s\S]*?)\n\s*\-+\s*\n/;

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
    var tmp = src.replace(/<pre><code/g, "<div class='snippet'><pre><code");
    return tmp.replace(/<\/code><\/pre>/g, "</code></pre></div>");
};
