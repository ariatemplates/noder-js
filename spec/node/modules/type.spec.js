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

describe('Type', function() {
    var type = require('../../../src/modules/type.js');
    var expect = require("expect.js");
    it('isPlainObject', function() {
        var isPlainObject = type.isPlainObject;
        expect(isPlainObject({})).to.equal(true);
        expect(isPlainObject({
            value: 1
        })).to.equal(true);
        expect(isPlainObject([])).to.equal(false);
        expect(isPlainObject(Array(1))).to.equal(false);
        expect(isPlainObject(new Array(1))).to.equal(false);
        expect(isPlainObject([{}])).to.equal(false);
        expect(isPlainObject("hello")).to.equal(false);
        expect(isPlainObject(String("hello"))).to.equal(false);
        var StringCopy = String;
        expect(isPlainObject(new StringCopy("hello"))).to.equal(false);
        expect(isPlainObject(5)).to.equal(false);
        expect(isPlainObject(Number(5))).to.equal(false);
        var NumberCopy = Number;
        expect(isPlainObject(new NumberCopy(5))).to.equal(false);
        expect(isPlainObject(/myRegexp/)).to.equal(false);
        expect(isPlainObject( /*undefined*/ )).to.equal(false);
        expect(isPlainObject(NaN)).to.equal(false);
    });
});
