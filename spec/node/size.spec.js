describe("Size", function() {
    var fs = require('fs');
    var path = require('path');
    var expect = require("chai").expect;

    var checkSize = function(file, maxSize) {
        var stat = fs.statSync(path.join(__dirname, '../../', file));
        expect(stat.size).to.be.below(maxSize);
    };

    it('Noder should stay smaller than 5 kB', function() {
        checkSize('dist/browser/noder.min.js.gz', 5000);
    });
});
