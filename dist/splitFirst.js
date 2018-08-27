'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
function splitFirst(string, delimiter) {
  if (typeof string !== 'string') throw Error('Expected string. Got: ' + string);

  var index = string.indexOf(delimiter);

  if (index === -1) return [string];

  return [string.substring(0, index), string.substring(index + 1, string.length)];
}

exports.default = splitFirst;