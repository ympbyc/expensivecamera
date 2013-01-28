(function () {
  'use strict';

  var fs, excam, beautify;

  fs = require('fs');
  excam = require('./expensivecamera');
  beautify = require('../lib/beautify');

  if (process.argv[2]) {
    fs.readFile(process.argv[2], 'utf8', function (err, src) {
      if (err) throw err;
      console.log(
        beautify.js_beautify(excam.parse(src), {
          indent_size: 2
        , indent_char: ' '
        , jslint_happy: true
        }));
    });
  }

  else {
    console.log('REPL is comming soon');
  }
}());
