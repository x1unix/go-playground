import { assert, describe, test } from 'vitest'
import { parseExpression } from './parse'

const testParseExpression = (input: string, want: ReturnType<typeof parseExpression>) => {
  const got = parseExpression(input)
  assert.deepEqual(got, want)
}

describe('parseQuery', () => {
  test('should return null for empty values', () => {
    testParseExpression('', null)
  })

  test('should parse literals', () => {
    testParseExpression('foo', {
      value: 'foo',
    })
  })

  test('should return package query for dot', () => {
    testParseExpression('foo.', {
      packageName: 'foo',
    })
  })

  test('should return package symbol query', () => {
    testParseExpression('fmt.Println', {
      packageName: 'fmt',
      value: 'Println',
    })
  })

  test('should ignore spaces before string', () => {
    testParseExpression('  os.Environ', {
      packageName: 'os',
      value: 'Environ',
    })
  })

  test('should match function call argument', () => {
    testParseExpression('(foo.bar', {
      packageName: 'foo',
      value: 'bar',
    })
  })

  test('should match values near operators', () => {
    testParseExpression('+ foo', {
      value: 'foo',
    })
  })

  test('should match pointer types', () => {
    testParseExpression('(t *testing.T', {
      packageName: 'testing',
      value: 'T',
    })
  })

  test('should omit unmatched long expressions', () => {
    testParseExpression('foo.bar.baz', null)
  })

  test('should not match inside string statement', () => {
    testParseExpression('" foo', null)
    testParseExpression('"foo', null)
    testParseExpression('`foo', null)
  })
})
