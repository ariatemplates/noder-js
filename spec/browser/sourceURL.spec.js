var SourceURL = require('../../src/browser-modules/sourceURL.js');
var expect = global.expect ? global.expect : require("expect.js");

describe("SourceURL", function() {
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
