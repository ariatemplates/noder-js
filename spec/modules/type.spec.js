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

describe('Type', function () {
    var type = require('../../src/modules/type.js');
    it('isPlainObject', function () {
        var isPlainObject = type.isPlainObject;
        expect(isPlainObject({})).toBe(true);
        expect(isPlainObject({
            value: 1
        })).toBe(true);
        expect(isPlainObject([])).toBe(false);
        expect(isPlainObject(Array(1))).toBe(false);
        expect(isPlainObject(new Array(1))).toBe(false);
        expect(isPlainObject([{}])).toBe(false);
        expect(isPlainObject("hello")).toBe(false);
        expect(isPlainObject(String("hello"))).toBe(false);
        var StringCopy = String;
        expect(isPlainObject(new StringCopy("hello"))).toBe(false);
        expect(isPlainObject(5)).toBe(false);
        expect(isPlainObject(Number(5))).toBe(false);
        var NumberCopy = Number;
        expect(isPlainObject(new NumberCopy(5))).toBe(false);
        expect(isPlainObject(/myRegexp/)).toBe(false);
        expect(isPlainObject( /*undefined*/ )).toBe(false);
        expect(isPlainObject(NaN)).toBe(false);
    });
});