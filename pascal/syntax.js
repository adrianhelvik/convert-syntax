export default {
  lex: [
    ['word', /^[a-zA-Z][a-zA-Z0-9]*/],
    ['numeric_literal', /^[0-9]+/],
    ['char_literal', /^'(('')|[^'])+'/],
    ['char_literal', /^’((’’)|[^’])+’/],
    ['comment', /^\/\*(.|[\s])+?\*\//m, 'ignore'],
    ['comment', /^{.+}/m, 'ignore'],
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
