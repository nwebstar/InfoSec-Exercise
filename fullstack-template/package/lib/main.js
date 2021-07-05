(function () {
    var program = require('commander');
    var pkg = require("../package.json");

    var folder = require('../src/folder');

    const fs = require('fs');

    program
        .version(pkg.version)
        .option("-n, new [new]”, “set name to new project.");

    program.parse(process.argv);

    if (program.new) {
        var f = program.new;
        folder.create(f);
        folder.create(f+'/models');
        folder.create(f+'/views');
        folder.create(f+'/controllers');
    }

}).call(this);