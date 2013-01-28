(function () {
  'use strict';

  var fs, excam;

  fs = require('fs');
  excam = require('./expensivecamera');

  if (process.argv[1]) {
    fs.readFile(process.argv[1], 'utf8', function (err, src) {
      if (err) throw err;
      console.log(excam.parse(src));
    });
  }
}());
