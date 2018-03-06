var expect = global.expect ? global.expect : require("expect.js");
var noder = global.noder || require('../../dist/node/noder.js');

describe("SourceURL", function() {
    var SourceURL;
    if (global.noder) {
        var newRootModule = noder.createContext({
            packaging: {
                requestConfig: {
                    sync: true
                },
                baseUrl: "/base/src/browser-modules/"
            }
        });
        SourceURL = newRootModule.require('sourceURL.js');
    } else {
        SourceURL = require('../../src/browser-modules/sourceURL.js');
    }

    it('should generate sourceURL Basic', function() {
        var src = "util/json";
        var location = {
            protocol: "http:",
            hostname: "test.aria.com"
        };
        var sourceURL = SourceURL.generateSourceURL(location, src);
        expect(sourceURL).to.equal('http://test.aria.com/util/json');
    });

    it('should generate sourceURL Relative', function() {
        var src = "./util/json";
        var location = {
            protocol: "http:",
            pathname: "/dist",
            hostname: "test.aria.com"
        };
        var sourceURL = SourceURL.generateSourceURL(location, src);
        expect(sourceURL).to.equal('http://test.aria.com/dist/util/json');
    });

    it('should generate sourceURL Absolute', function() {
        var src = "/util/json";
        var location = {
            protocol: "http:",
            hostname: "test.aria.com"
        };
        var sourceURL = SourceURL.generateSourceURL(location, src);
        expect(sourceURL).to.equal('http://test.aria.com/util/json');
    });

    it('should generate sourceURL With URL', function() {
        var src = "http://test.aria.com/util/json";
        var location = {
            protocol: "http:",
            pathname: "/dist",
            hostname: "test.aria.com"
        };
        var sourceURL = SourceURL.generateSourceURL(location, src);
        expect(sourceURL).to.equal('http://test.aria.com/util/json');
    });

    it('should generate sourceURL With Scheme', function() {
        var src = "aria://util/json";
        var location = {
            protocol: "http:",
            pathname: "/dist",
            hostname: "test.aria.com"
        };
        var sourceURL = SourceURL.generateSourceURL(location, src);
        expect(sourceURL).to.equal('aria://util/json');
    });

    it('should generate sourceURL NoLocation', function() {
        var src = "util/json";
        var sourceURL = SourceURL.generateSourceURL(undefined, src);
        expect(sourceURL).to.equal('util/json');
    });

});
