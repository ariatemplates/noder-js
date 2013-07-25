describe("Size", function() {
    var fs = require('fs');
    var path = require('path');
    var expect = require("expect.js");

    var checkSize = function(file, maxSize) {
        var stat = fs.statSync(path.join(__dirname, '../../', file));
        expect(stat.size).to.be.below(maxSize);
    };

    it('Noder should stay smaller than 6 kB', function() {
        checkSize('dist/browser/noder.min.js.gz', 6144 /* 6 kB = 6 * 1024 bytes */ );
    });
});
