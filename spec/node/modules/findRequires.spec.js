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

describe('Dependencies extraction', function() {
    var expect = require("expect.js");
    var extractDeps = require('../../../findRequires.js');

    var quoteRegExp = /['"]/g;
    var quoteReplacer = function(quote) {
        if (quote == '"') {
            return "'";
        } else {
            return '"';
        }
    };

    var expectDepsSimple = function(source, expected, includePlugins) {
        var res = extractDeps(source, includePlugins);
        expect(res).to.eql(expected);
    };

    var expectDeps = function(source, expected, includePlugins) {
        expectDepsSimple(source, expected, includePlugins);
        // all tests with simple quotes should work the same when exchanging simple and double quotes:
        expectDepsSimple(source.replace(quoteRegExp, quoteReplacer), expected, includePlugins);
    };

    it('Comments', function() {
        // ignore comments:
        expectDeps('/*require("myDependency");*/ var e = require("myOtherDependency");', ["myOtherDependency"]);
        expectDeps('// require("myDependency"); \nvar e = require("myOtherDependency");', ["myOtherDependency"]);
        expectDeps('require("myDependency"); \n//var e = require("myOtherDependency");', ["myDependency"]);
        expectDeps('//require("myDependency"); var e = require("myOtherDependency");', []);
        expectDeps('/*/ require("stillInComment"); /*/ var e = require("notInComment"); ', ["notInComment"]);
    });

    it('Normal behavior', function() {
        expectDeps('require("myDependency"); var e = require("myOtherDependency");', ["myDependency", "myOtherDependency"]);
        expectDeps('var arequire = require("asyncRequire"); arequire(["myAsyncDep"]).then(function(){var myAsyncDep = arequire("myAsyncDep"); /*...*/ });', ["asyncRequire"]);
        expectDeps('var requireasync = require("asyncRequire"); requireasync(["myAsyncDep"]).then(function(){var myAsyncDep = requireasync("myAsyncDep"); /*...*/ });', ["asyncRequire"]);
        expectDeps('var other = something(); var ignoreMe = other.require("ignoreMe");', []);
        expectDeps('var other = something(); var ignoreMe = other . /* comment in the middle */ require("ignoreMe");', []);
        expectDeps('var other = something(); var ignoreMe = other /* comment in the middle */ . require("ignoreMe");', []);
        expectDeps('var other = something(); var ignoreMe = other . /*/ comment in the middle /*/ require("ignoreMe");', []);
        expectDeps('var other = something(); var ignoreMe = other /*/ comment in the middle /*/ . require("ignoreMe");', []);
        expectDeps('var other = something(); var ignoreMe = other . // comment in the middle \n require("ignoreMe");', []);
    });

    it('Quotes', function() {
        expectDeps('var trueRequire = require("trueRequire"); var falseRequire = \'var b = require("falseRequire")\';', ["trueRequire"]);
        expectDeps('var str = "\\"" ; var trueRequire = require("trueRequire"); var otherStr = "\\\\\\"\\\\";', ["trueRequire"]);
    });

    it('RegExps', function() {
        expectDeps('var regExp = /["]/; var trueRequire = require("trueRequire"); var falseRequire = /var b = require("falseRequire")/', ["trueRequire"]);
        expectDeps('var re = /\\"/ ; var trueRequire = require("trueRequire"); var otherRe = /\\\\\\"\\\\/;', ["trueRequire"]);
        expectDeps('var notARegExp = 4 / 2 ; var trueRequire = require("trueRequire"); var otherDivision = 4 / 2 ;', ["trueRequire"]);
        expectDeps('var itsARegExp = /reg/ ; var trueRequire = require("trueRequire"); var anotherRegExp = /reg/ ;', ["trueRequire"]);
        expectDeps('var notARegExp = (4) / 2 ; var trueRequire = require("trueRequire"); var otherDivision = (4) / 2 ;', ["trueRequire"]);
        expectDeps('var itsARegExp = (/reg/) ; var trueRequire = require("trueRequire"); var anotherRegExp = (/reg/) ;', ["trueRequire"]);
        expectDeps('var notARegExp = 4 /* comment */ / 2 ; var trueRequire = require("trueRequire"); var otherDivision = (4) /* comment */ / 2 ;', ["trueRequire"]);
        expectDeps('var itsARegExp = ( /* comment */ /require("falseRequire")/) ; var trueRequire = require("trueRequire"); var anotherRegExp = (/* comment */ /require("falseRequire")/) ;', ["trueRequire"]);
        expectDeps('var notARegExp = 4 /* comment 1 */ /* comment 2 */ / 2 ; var trueRequire = require("trueRequire"); var otherDivision = (4) /* comment 1 */ /* comment 2*/ / 2 ;', ["trueRequire"]);
        expectDeps('var itsARegExp = ( /* comment 1 */ /* comment 2 */ /require("falseRequire")/) ; var trueRequire = require("trueRequire"); var anotherRegExp = (/* comment 1 */ /* comment 2 */ /require("falseRequire")/) ;', ["trueRequire"]);
        expectDeps('var notARegExp = 4 // comment 1 \n // comment 2 \n / 2 ; var trueRequire = require("trueRequire"); var otherDivision = (4) // comment 1 \n // comment 2\n / 2 ;', ["trueRequire"]);
        expectDeps('var itsARegExp = ( // comment 1 \n // comment 2 \n /require("falseRequire")/) ; var trueRequire = require("trueRequire"); var anotherRegExp = (// comment 1 \n // comment 2 \n /require("falseRequire")/) ;', ["trueRequire"]);
        expectDeps('var something = 5 ; var myTest = function() { return something /require("trueRequire") ; } ;', ["trueRequire"]);
        expectDeps('var notreturn = 5 ; var myTest = function() { return notreturn /require("trueRequire") ; } ;', ["trueRequire"]);
        expectDeps('var notthrow = 5 ; var myTest = function() { return notthrow /require("trueRequire") ; } ;', ["trueRequire"]);
        expectDeps('var notnew = 5 ; var myTest = function() { return notnew /require("trueRequire") ; } ;', ["trueRequire"]);
        expectDeps('var notin = 5 ; var myTest = function() { return notin /require("trueRequire") ; } ;', ["trueRequire"]);
        expectDeps('var myTest = function() { return /require("falseRequire")/.test(require("trueRequire")) ; } ;', ["trueRequire"]);
        expectDeps('var myTest = function() { throw /require("falseRequire")/.test(require("trueRequire")) ; } ;', ["trueRequire"]);
        expectDeps('var myTest = function() { return new /require("falseRequire")/.something(require("trueRequire")) ; } ;', ["trueRequire"]);
        expectDeps('var myTest = function() { return "test" in /require("falseRequire")/.something(require("trueRequire")) ; } ;', ["trueRequire"]);
        expectDeps('var myTest = function() { something /require("trueRequire") ; } ;', ["trueRequire"]);
    });

    it('Quotes and comments', function() {
        expectDeps('var e = "/* ", g = require("trueRequire"), f = " */"; ', ["trueRequire"]);
        expectDeps('var e = "// ", g = require("trueRequire"); ', ["trueRequire"]);
    });

    it('Expressions in require', function() {
        expectDeps('var expressionRequire = require(/* here is a comment */ "trueRequire");', ["trueRequire"]);
        expectDeps('var expressionRequire = require(// here is a comment \n "trueRequire");', ["trueRequire"]);
        expectDeps('var expressionRequire = require("trueRequire" /* here is a comment */);', ["trueRequire"]);
        expectDeps('var expressionRequire = require("trueRequire" // here is a comment \n);', ["trueRequire"]);
        expectDeps('var expressionRequire = require(/* a comment */ "trueRequire" /* another comment */);', ["trueRequire"]);
        expectDeps('var expressionRequire = require(// a comment \n "trueRequire" // another comment \n);', ["trueRequire"]);
        expectDeps('var expressionRequire = require(/* several */ /* comments */ "trueRequire" /* several */ /* comments */);', ["trueRequire"]);
        expectDeps('var expressionRequire = require(// several \n // comments \n "trueRequire" // several \n // comments \n);', ["trueRequire"]);
        expectDeps('var expressionRequire = require(// several \n /* comments */ "trueRequire" /* several */ // comments \n);', ["trueRequire"]);
        expectDeps('var expressionRequire = require("firstExpression" + "otherExpression");', []);
        expectDeps('var expressionRequire = require("firstExpression" + 1);', []);
        expectDeps('var expressionRequire = require(require("innerRequire").value);', ["innerRequire"]);
        expectDeps('var expressionRequire = require(1 + "firstExpression");', []);
        expectDeps('var expressionRequire = require("dynamicRequire" /* here is a comment */ + 1);', []);
    });

    it('Plugins', function() {
        expectDeps('var e = require("$myPlugin").something.myMethod()', ["$myPlugin"], true);
        expectDeps('var e = require("$myPlugin").myMethod("something")', ["$myPlugin", {
            module: "$myPlugin",
            method: "myMethod",
            args: ["something"] // test with a string parameter
        }], true);
        expectDeps('var e = require("$myPlugin").myMethod(module)', ["$myPlugin", {
            module: "$myPlugin",
            method: "myMethod",
            args: [ // test with a variable parameter
                ["module"]
            ]
        }], true);
        expectDeps('var e = require("$myPlugin").myMethod( /* comment */ "some /* thing */ else" /* other */ )', ["$myPlugin", {
            module: "$myPlugin",
            method: "myMethod",
            args: ["some /* thing */ else"] // test with comments in the middle:
        }], true);
        expectDeps('var e = require("$myPlugin").myMethod("something", "other element")', ["$myPlugin", {
            module: "$myPlugin",
            method: "myMethod",
            args: ["something", "other element"] // test with 2 string parameters
        }], true);
        expectDeps('var e = require("$myPlugin").myMethod(__dirname, null)', ["$myPlugin", {
            module: "$myPlugin",
            method: "myMethod",
            args: [
                ["__dirname"],
                ["null"]
            ] // test with 2 variable parameters
        }], true);
        expectDeps('var e = require("$myPlugin").myMethod()', ["$myPlugin", {
            module: "$myPlugin",
            method: "myMethod",
            args: [] // test with no parameter
        }], true);

    });
});
