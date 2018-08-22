import splitFirst from './splitFirst'

it('splits a string', () => {
  expect(splitFirst('foo:bar:baz', ':')).toEqual([
    'foo',
    'bar:baz',
  ])
})

it('does not split non-matches', () => {
  expect(splitFirst('foo', ':')).toEqual([
    'foo',
  ])
})
