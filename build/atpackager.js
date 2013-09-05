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

var atpackager = null;

/**
 * Sets the instance of atpackager to be used when needed.
 * @param {Object} atpackager
 */
exports.init = function(initAtpackager) {
    if (initAtpackager && atpackager !== initAtpackager) {
        if (atpackager) {
            throw new Error("Trying to override the stored atpackager instance.");
        }
        atpackager = initAtpackager;
    }
};

/**
 * Returns the stored instance of atpackager.
 * @return {Object}
 */
exports.atpackager = function() {
    if (!atpackager) {
        throw new Error("atpackager is not yet defined.");
    }
    return atpackager;
};
