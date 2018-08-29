'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _splitFirst3 = require('./splitFirst');

var _splitFirst4 = _interopRequireDefault(_splitFirst3);

var _circularJson = require('circular-json');

var _circularJson2 = _interopRequireDefault(_circularJson);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var validRuleTypes = ['sequence', 'optional', 'many', 'one_plus', 'zero_plus', 'one', 'either', 'all'];

function convertSyntax(syntax) {
  var rulesMap = new Map();
  var shallowRules = [];

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = syntax.lex[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var ruleSchema = _step.value;

      addLexRule(ruleSchema);
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = Object.keys(syntax.parse)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var type = _step2.value;

      addShallowParseRule(type, syntax.parse[type]);
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = shallowRules[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var rule = _step3.value;

      populateRule(rule);
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }

  return rulesMap;

  function addLexRule(ruleSchema) {
    var type = ruleSchema[0];
    rulesMap.set(type, {
      type: type,
      ruleType: 'lex'
    });
  }

  function addShallowParseRule(type, ruleSchema) {
    var rule = {
      ruleType: ruleSchema[0],
      type: type,
      ruleSchema: ruleSchema
    };
    rulesMap.set(type, rule);
    shallowRules.push(rule);
  }

  function populateRule(rule) {
    if (!rule.ruleSchema) return;

    switch (rule.ruleType) {
      case 'either':
      case 'sequence':
        populateMultiRule(rule);
        break;
      case 'one':
        populateOneRule(rule);
        break;
      case 'many':
        populateManyRule(rule);
        break;
      case 'zero_plus':
        populateZeroPlus(rule);
        break;
      case 'one_plus':
        populateOnePlus(rule);
        break;
      case 'optional':
        populateOptionalRule(rule);
        break;
      case 'all':
        populateAll(rule);
        break;
      default:
        throw Error('Unknown rule type: "' + rule.ruleType + '" in rule ' + _circularJson2.default.stringify(rule));
    }

    delete rule.ruleSchema;
  }

  function populateAll(rule) {
    var ruleSchema = rule.ruleSchema;

    var subType = ruleSchema[1];

    rule.subRule = lookupRule(subType);
  }

  function populateOptionalRule(rule) {
    var ruleSchema = rule.ruleSchema;

    var subType = ruleSchema[1];

    rule.subRule = lookupRule(subType);
  }

  function populateManyRule(rule) {
    var ruleSchema = rule.ruleSchema;

    var subType = ruleSchema[1];
    var delimiter = ruleSchema[2];

    rule.subRule = lookupRule(subType);

    if (delimiter) {
      rule.delimiter = lookupRule(delimiter);
    }
  }

  function populateOneRule(rule) {
    var ruleSchema = rule.ruleSchema;

    var subType = ruleSchema[1];

    rule.subRule = lookupRule(subType);
  }

  function populateZeroPlus(rule) {
    var ruleSchema = rule.ruleSchema;

    var subType = ruleSchema[1];
    var delimiter = ruleSchema[2];

    rule.subRule = lookupRule(subType);

    if (delimiter) rule.delimiter = lookupRule(delimiter);
  }

  function populateOnePlus(rule) {
    var ruleSchema = rule.ruleSchema;

    var subType = ruleSchema[1];
    var delimiter = ruleSchema[2];

    rule.subRule = lookupRule(subType);

    if (delimiter) rule.delimiter = lookupRule(delimiter);
  }

  function populateMultiRule(rule) {
    var subType = rule.ruleSchema[1];
    rule.subRule = [];

    (0, _assert2.default)(Array.isArray(subType), 'Expected subType to be an array. Got ' + _circularJson2.default.stringify(subType) + ' in rule: ' + _circularJson2.default.stringify(rule));

    var _iteratorNormalCompletion4 = true;
    var _didIteratorError4 = false;
    var _iteratorError4 = undefined;

    try {
      for (var _iterator4 = subType[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
        var part = _step4.value;

        if (typeof part === 'string') {
          if (part === 'VERIFIED') {
            rule.subRule.push({ ruleType: 'verified' });
          } else {
            var subRule = lookupRule(part);
            rule.subRule.push(subRule);
          }
        } else {
          var _subRule = {
            ruleType: part[0],
            ruleSchema: part,
            type: 'anonymous'
          };
          rule.subRule.push(_subRule);
          populateRule(_subRule);
        }
      }
    } catch (err) {
      _didIteratorError4 = true;
      _iteratorError4 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion4 && _iterator4.return) {
          _iterator4.return();
        }
      } finally {
        if (_didIteratorError4) {
          throw _iteratorError4;
        }
      }
    }
  }

  function lookupRule(x) {
    if (!x) throw Error('Cannot lookup ' + x);

    if (Array.isArray(x)) {
      if (!validRuleTypes.includes(x[0])) throw Error(x[0] + ' is not a valid rule type. Maybe you used an array where you should have used a string?');
      var _rule = {
        ruleType: x[0],
        type: 'anonymous',
        ruleSchema: x
      };
      populateRule(_rule);
      return _rule;
    }

    var _splitFirst = (0, _splitFirst4.default)(x, ':'),
        _splitFirst2 = _slicedToArray(_splitFirst, 2),
        key = _splitFirst2[0],
        value = _splitFirst2[1];

    var subRule = void 0;

    if (value) {
      if (!rulesMap.has(key)) throw Error('Failed to lookup rule ' + key + ' from type:value pair "' + key + ':' + value + '"');
      subRule = Object.create(rulesMap.get(key));
      if (subRule) subRule.value = value;
    } else {
      subRule = rulesMap.get(x);
    }

    if (!subRule) throw Error('lookupRule: Failed to lookup rule: ' + _circularJson2.default.stringify(key));

    return subRule;
  }
}

exports.default = convertSyntax;