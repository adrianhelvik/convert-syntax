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

  /* Sub rules are created with prototypes, so this comparison does not work.
  expect(rule).toEqual({
    type: 'main',
    ruleType: 'many',
    subRule: {
      type: 'statement',
      ruleType: 'either',
      subRule: [
        {
          type: 'function',
          ruleType: 'sequence',
          subRule: [
            { type: 'word', value: 'fn', ruleType: 'lex' },
            { type: 'symbol', value: '{', ruleType: 'lex', verified: true },
            { type: 'symbol', value: '}', ruleType: 'lex', verified: true },
          ]
        },
        { type: 'word', ruleType: 'lex' }
      ]
    }
  })
  */

  /* This does though */
  expect(rule.subRule.subRule[0].subRule[0].verified).not.toBeTruthy()
  expect(rule.subRule.subRule[0].subRule[1].verified).toBe(true)
  expect(rule.subRule.subRule[0].subRule[2].verified).toBe(true)
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
