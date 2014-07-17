define("paintings/catalogue.js", ["./painting"], function(module) {
    var require = module.require;
    var painting = require("./painting");
    module.exports = function() {
        return painting();
    };
});

define("paintings/image.js", [], function(module) {
    module.exports = function() {
        return "testString";
    };
});

define("paintings/painting.js", ["./image"], function(module) {
    var require = module.require;
    var image = require("./image");
    module.exports = function() {
        return image();
    };
});
