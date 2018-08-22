import convertSyntax from '../../src/convertSyntax'
import syntax from '../../pascal/syntax'
import lex from '@adrianhelvik/lex'
import JSON from 'circular-json'
import fs from 'fs'

const source = fs.readFileSync(__dirname + '/../../pascal/primes.pas', 'utf-8')

it('can lex the syntax', () => {
  lex({ source, syntax })
})

it('can convert the syntax', () => {
  const mainRule = convertSyntax(syntax)
})
