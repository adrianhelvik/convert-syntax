import convertSyntax from './convertSyntax'

it('converts lex types', () => {
  const syntax = {
    lex: [
      ['word', /^[a-zA-Z]+/],
      ['whitespace', /^[\s]+/],
    ],
    parse: {
      main: ['sequence', [
        'word',
        'whitespace',
      ]]
    }
  }

  expect(convertSyntax(syntax)).toEqual({
    type: 'main',
    ruleType: 'sequence',
    subRule: [
      {
        type: 'word',
        ruleType: 'lex',
      },
      {
        type: 'whitespace',
        ruleType: 'lex',
      }
    ]
  })
})

it('converts key:value types', () => {
  const syntax = {
    lex: [
      ['word', /^[a-zA-Z]+/],
      ['whitespace', /^[\s]+/, 'ignore'],
    ],
    parse: {
      main: ['sequence', [
        'word:hello',
        'word:world',
      ]]
    }
  }

  /* Does not work with prototypes
  expect(convertSyntax(syntax)).toEqual({
    type: 'main',
    ruleType: 'sequence',
    subRule: [
      {
        type: 'word',
        value: 'hello',
        ruleType: 'lex',
      },
      {
        type: 'word',
        value: 'world',
        ruleType: 'lex',
      }
    ]
  })
  */

  const rule = convertSyntax(syntax)

  expect(rule.subRule[0].type).toBe('word')
  expect(rule.subRule[0].value).toBe('hello')

  expect(rule.subRule[1].type).toBe('word')
  expect(rule.subRule[1].value).toBe('world')
})

it('converts the many type', () => {
  const syntax = {
    lex: [
      ['word', /^[a-zA-Z]+/],
      ['whitespace', /^[\s]+/],
    ],
    parse: {
      main: ['many', 'word'],
    }
  }

  expect(convertSyntax(syntax)).toEqual({
    type: 'main',
    ruleType: 'many',
    subRule: {
      type: 'word',
      ruleType: 'lex',
    },
  })
})

describe('from ergolang', () => {
  it('should catch this wrong usage', () => {
    const syntax = {
      lex: [
        ['string', /^'((\\')|[^'])+'/],
        ['whitespace', /^\s+/, 'ignore'],
        ['keyword', /^(let)/],
        ['ident', /^[a-zA-Z][a-zA-Z0-9]*/],
        ['double', /^([1-9][0-9]*)?\.[0-9]+/],
        ['integer', /^[1-9][0-9]*/],
        ['symbol', /^[=[\],()]/],
      ],
      parse: {
        main: ['many', [
          'statement',
        ]],
        statement: ['either', [
          'funcCall',
          'varDecl',
        ]],
        funcCall: ['sequence', [
          'ident',
          'expression',
        ]],
        expression: ['either', [
          'ident',
        ]],
      }
    }

    expect(() => {
      convertSyntax(syntax)
    }).toThrow(/statement.+rule type/)
  })
})

it('can have delimiters for the many type', () => {
  const syntax = {
    lex: [
      ['word', /^[a-zA-Z]+/],
      ['whitespace', /^[\s]+/],
      ['symbol', /^[,]/],
    ],
    parse: {
      main: ['many', 'word', 'symbol:,']
    }
  }

  const converted = convertSyntax(syntax)

  /*
  expect(converted).toEqual({
    type: 'main',
    ruleType: 'many',
    subRule: {
      type: 'word',
      ruleType: 'lex',
    },
    delimiter: {
      ruleType: 'lex',
      type: 'symbol',
      value: ',',
    }
  })
  */

  expect(converted.type).toBe('main')
  expect(converted.ruleType).toBe('many')
  expect(converted.subRule.type).toBe('word')
  expect(converted.subRule.ruleType).toBe('lex')
  expect(converted.delimiter.ruleType).toBe('lex')
  expect(converted.delimiter.type).toBe('symbol')
  expect(converted.delimiter.value).toBe(',')
})

it('can convert VERIFIED sequence sub rules', () => {
  const syntax = {
    lex: [
      ['word', /^[a-zA-Z]+/],
      ['whitespace', /^[\s]+/],
      ['symbol', /^[,(){}]/],
    ],
    parse: {
      main: ['many', 'statement'],
      statement: ['either', [
        'function',
        'word',
      ]],
      function: ['sequence', [
        'word:fn',
        'VERIFIED',
        'symbol:{',
        'symbol:}',
      ]],
    }
  }

  const rule = convertSyntax(syntax)

  expect(rule.subRule.subRule[0].subRule[1].ruleType).toBe('verified')
})

describe('optional', () => {
  const syntax = {
    lex: [
      ['symbol', /^[!]/],
    ],
    parse: {
      main: ['optional', 'symbol:!',],
    }
  }

  it('does not throw', () => {
    expect(() => {
      convertSyntax(syntax)
    }).not.toThrow()
  })
})

describe('error from pascal', () => {
  const syntax = {
    lex: [
      ['symbol', /^(<=|>=|[.+;=:[\]*()<>])/],
      ['name', /^[a-zA-Z]+/],
    ],
    parse: {
      main: ['sequence', [
        ['optional', [
          'symbol:[',
          'symbol:]',
        ]],
      ]],
    }
  }

  it('throws a descriptive error', () => {
    expect(() => {
      convertSyntax(syntax)
    }).toThrow(/array.+should have used a string/i)
  })
})

test('pascal did not get verified rules', () => {
  const syntax = {
    lex: [
      ['comment', /^\/\*(.|[\s\n])+?\*\//m, 'ignore'],
      ['comment', /^{.+}/m, 'ignore'],
      ['word', /^[a-zA-Z][a-zA-Z0-9]*/],
      ['numeric_literal', /^[0-9]+/],
      ['char_literal', /^'(('')|[^'])+'/],
      ['char_literal', /^’((’’)|[^’])+’/],
      ['whitespace', /^[\s]+/m, 'ignore'],
      ['symbol', /^(<=|>=|[.+;=:[\]*()<>])/],
    ],
    parse: {

      // 2.2

      main: ['sequence', [
        'word:program',
        'name',
        'symbol:;',
        'block',
        'symbol:.',
      ]],

      // 2.2.1

      name: ['one', 'word'],
      block: ['sequence', [
        ['optional', 'const_decl_part'],
        ['optional', 'var_decl_part'],
        ['optional', ['one_plus', ['either', [ // Changed from one_plus to zero_plus
          'func_decl',
          'proc_decl',
        ]]]],
        'word:begin',
        'stmt_list',
        'word:end',
      ]],

      // 2.2.1.1

      const_decl_part: ['sequence', [
        'word:const',
        'VERIFIED',
        ['one_plus', 'const_decl'],
      ]],
      const_decl: ['sequence', [
        'name',
        'symbol:=',
        'constant',
        'symbol:;',
      ]],
      constant: ['sequence', [
        ['optional', 'prefix_opr'],
        'unsigned_constant',
      ]],
      unsigned_constant: ['either', [
        'name',
        'numeric_literal',
        'char_literal',
      ]],
      prefix_opr: ['either', [
        'symbol:+',
        'symbol:-',
      ]],
      var_decl_part: ['sequence', [
        'word:var',
        'VERIFIED',
        ['one_plus', 'var_decl'],
      ]],
      var_decl: ['sequence', [
        'name',
        'symbol::',
        'type',
        'symbol:;',
      ]],
      type_name: ['one', 'name'],
      array_type: ['sequence', [
        'word:array',
        'symbol:[',
        'constant',
        'symbol:..',
        'constant',
        'symbol:]',
        'word:of',
        'type',
      ]],

      // 2.2.1.3

      func_decl: ['sequence', [
        'word:function',
        'name',
        ['optional', 'param_decl_list'],
        'symbol::',
        'type_name',
        'symbol:;',
        'block',
        'symbol:;',
      ]],
      proc_decl: ['sequence', [
        'word:procedure',
        'name',
        ['optional', 'param_decl_list'],
        'symbol:;',
        'block',
        'symbol:;',
      ]],

      // 2.2.2

      param_decl_list: ['sequence', [
        'symbol:(',
        ['one_plus', 'param_decl', 'symbol:;'],
        'symbol:)',
      ]],
      param_decl: ['sequence', [
        'name',
        'symbol::',
        'type_name',
      ]],
      stmt_list: ['zero_plus', 'statement', 'symbol:;'],
      statement: ['either', [
        'assign_stmt',
        'compound_stmt',
        'empty_stmt',
        'if_stmt',
        'proc_call',
        'while_stmt',
      ]],

      // 2.2.2.1

      empty_stmt: ['sequence', ['symbol:;']],

      // 2.2.2.2

      assign_stmt: ['sequence', [
        'variable',
        'symbol::=',
        'expression',
      ]],
      variable: ['sequence', [
        'name',
        ['optional', ['sequence', [
          'symbol:[',
          'expression',
          'symbol:]',
        ]]],
      ]],
      proc_call: ['sequence', [
        'name',
        ['optional', ['sequence', [
          'symbol:(',
          ['one_plus', 'expression', 'symbol:,'],
          'symbol:)',
        ]]],
      ]],

      // 2.2.2.4

      if_stmt: ['sequence', [
        'word:if',
        'expression',
        'word:then',
        'statement',
        ['optional', ['sequence', [
          'word:else',
          'statement',
        ]]],
      ]],

      // 2.2.2.5

      while_stmt: ['sequence', [
        'word:while',
        'expression',
        'word:do',
        'statement',
      ]],

      // 2.2.2.6

      compound_stmt: ['sequence', [
        'word:begin',
        'stmt_list',
        'word:end',
      ]],

      // 2.2.3

      expression: ['sequence', [
        'simple_expr',
        'rel_opr',
        'simple_expr',
      ]],
      rel_opr: ['either', [
        'symbol:=',
        'symbol:<>',
        'symbol:<',
        'symbol:<=',
        'symbol:>',
        'symbol:>=',
      ]],
      simple_expr: ['sequence', [
        ['optional', 'prefix_opr'],
        ['one_plus', 'term_opr', 'term'],
      ]],
      term_opr: ['either', [
        'symbol:+',
        'symbol:-',
        'word:or',
      ]],
      term: ['one_plus', 'factor', 'factor_opr'],

      // 2.2.4

      factor_opr: ['either', [
        'symbol:*',
        'word:div',
        'word:mod',
        'word:and',
      ]],
      factor: ['either', [
        'unsigned_constant',
        'variable',
        'func_call',
        'inner_expr',
        'negation',
      ]],
      func_call: ['sequence', [
        'name',
        ['optional', ['sequence', [
          'symbol:(',
          ['one_plus', 'expression', 'symbol:,'],
          'symbol:)',
        ]]],
      ]],
      inner_expr: ['sequence', [
        'symbol:(',
        'expression',
        'symbol:)',
      ]],
      negation: ['sequence', [
        'word:not',
        'factor',
      ]],
      type: ['one', 'word'],
    }
  }

  const rule = convertSyntax(syntax)
  expect(rule.subRule[3].subRule[1].subRule.subRule[1]).toEqual({ ruleType: 'verified' })
})

it('catches non-existant types', () => {
  const syntax = {
    lex: [],
    parse: {
      main: ['one', 'NOPE:bar']
    }
  }

  expect(() => {
    convertSyntax(syntax)
  }).toThrow('Failed to lookup rule NOPE from type:value pair "NOPE:bar"')
})
