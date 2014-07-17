define("paintings/catalogue.js", ["./painting"], function(module) {
    var require = module.require;
    var painting = require("./painting");
    module.exports = function() {
        return painting();
    };
});

define("paintings/painting.js", ["./image"], function(module) {
    var require = module.require;
    var image = require("./image");
    module.exports = function() {
        return image();
    };
});
