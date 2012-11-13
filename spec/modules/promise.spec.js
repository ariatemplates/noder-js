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

describe('Promises', function () {
    it('Standard promise tests suite', function () {
        var Deferred = require('../../src/modules/promise.js');
        var runTests = require('promise-tests');
        var adapter = {
            fulfilled: function (value) {
                var deferred = Deferred();
                deferred.resolve(value);
                return deferred.promise();
            },

            rejected: function (reason) {
                var deferred = Deferred();
                deferred.reject(reason);
                return deferred.promise();
            },

            pending: function () {
                var deferred = Deferred();

                return {
                    promise: deferred.promise(),
                    fulfill: deferred.resolve,
                    reject: deferred.reject
                };
            }
        };
        var finished = false;
        waitsFor(function () {
            return finished;
        }, null, 80000);

        runTests(adapter, ['promises-a', 'always-async', 'resolution-races', 'returning-a-promise'], function (failed) {
            expect(failed).toBe(0);
            finished = true;
        });

    });
});