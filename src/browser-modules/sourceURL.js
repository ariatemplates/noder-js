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
module.exports = {
    generateSourceURL: function(location, src) {
        var sourceURL = src;
        // Check if src match a an URL
        if (typeof src === "string" && location && !(/[a-z]*:\/\//.test(src))) {
            sourceURL = location.protocol + "//" + location.hostname;

            if (src.length > 0 && src[0] === "/") {
                sourceURL += src;
            } else if (src.length > 1 && src[0] === "." && src[1] === "/") {
                sourceURL += location.pathname + src.substring(1);
            } else {
                sourceURL += "/" + src;
            }
        }

        return sourceURL;
    }
};
