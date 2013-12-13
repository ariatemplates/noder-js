var configUtils = require('../helpers/configUtils');

var NoderResolverMap = function(cfg) {
    cfg = cfg || {};
    this.files = cfg.files || ['**/*'];
    this.noderConfig = cfg.noderConfig;
    this.noderContext = cfg.noderContext;
};

var addDirectories = function(config, fileName) {
    var pathParts = fileName.split(/[\\/]/);
    pathParts.pop(); // removes the file name
    var curConfigItem = config;
    while (pathParts.length > 0) {
        var pathItem = pathParts.shift();
        var newConfig = curConfigItem[pathItem];
        if (!newConfig) {
            newConfig = curConfigItem[pathItem] = {};
        }
        curConfigItem = newConfig;
    }
};

NoderResolverMap.prototype.onAddSourceFile = function(packaging, inputFile) {
    if (!inputFile.isMatch(this.files)) {
        return;
    }
    addDirectories(configUtils.getResolverMap(packaging, this.noderConfig, this.noderContext), inputFile.logicalPath);
};

module.exports = NoderResolverMap;
