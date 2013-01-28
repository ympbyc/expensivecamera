(function () {
  'use strict';

  var fs, excam, beautify, inputText;

  fs = require('fs');
  excam = require('./expensivecamera');
  beautify = require('../lib/beautify');

  inputText = '';

  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  process.stdin.on('data', function (chunk) {
    inputText += chunk;
  });

  process.stdin.on('end', function () {
    console.log(
        beautify.js_beautify(excam.parse(inputText), {
          indent_size: 2
        , indent_char: ' '
        , jslint_happy: true
        }));
    inputText = '';
  });

}());
