const fs = require('fs');
var colors = require('colors');

colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red'
});

var create = function (path) {
    var dirs = path.split('/');

    var cdir = '';
    dirs.forEach(item => {
        cdir += item + '/';
        if (!fs.existsSync(cdir)) {
            fs.mkdir(cdir, function (err) {
                if (err) {
                    console.log('failed to create directory'.error, err);
                } else {
                    console.log('making directory'.info, cdir.italic.data, 'succeeded'.info);
                }
            });
        } else {
            console.log('directory'.warn, cdir.italic.data, 'exists'.warn);
        }
    });
}

module.exports.create = create;