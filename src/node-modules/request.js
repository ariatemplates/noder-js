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

var fs = require('fs');
var Promise = require('../modules/promise.js');

var readFileSync = function(file, encoding, callback) {
    try {
        callback(null, fs.readFileSync(file, encoding));
    } catch (e) {
        callback(e);
    }
};

module.exports = function(url, options) {
    return new Promise(function(fulfill, reject) {
        var readFile = options && options.sync ? readFileSync : fs.readFile;
        readFile(url, 'utf-8', function(err, data) {
            if (err) {
                reject(err);
            } else {
                fulfill({
                    responseText: data
                });
            }
        });
    });
};
