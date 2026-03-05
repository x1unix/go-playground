import { Text } from '@codemirror/state'
import { assert, describe, test } from 'vitest'

import { Syntax } from '../types/common'
import { queryFromPosition } from './hover'

const newDoc = (source: string) => ({
  path: 'main.go',
  language: Syntax.Go,
  text: Text.of(source.split('\n')),
})

describe('hover queryFromPosition', () => {
  test('resolves selector member package query', () => {
    const source = 'package main\n\nfunc main() {\n\tfmt.Println("x")\n}\n'
    const doc = newDoc(source)
    const pos = source.indexOf('Println') + 1

    const query = queryFromPosition(doc, pos)
    assert.deepEqual(query, {
      packageName: 'fmt',
      value: 'Println',
      from: source.indexOf('fmt'),
      to: source.indexOf('Println') + 'Println'.length,
    })
  })

  test('resolves qualified type member package query', () => {
    const source = 'package main\nimport "testing"\nfunc TestExample(t *testing.T) {}'
    const doc = newDoc(source)
    const pos = source.indexOf('testing.T') + 'testing.'.length

    const query = queryFromPosition(doc, pos)
    assert.deepEqual(query, {
      packageName: 'testing',
      value: 'T',
      from: source.indexOf('testing.T'),
      to: source.indexOf('testing.T') + 'testing.T'.length,
    })
  })

  test('resolves package member query in binary expression', () => {
    const source = 'package main\nimport "math"\nfunc f(c circle) float64 {\n\treturn 2 * math.Pi * c.radius\n}'
    const doc = newDoc(source)
    const pos = source.indexOf('math.Pi') + 'math.P'.length

    const query = queryFromPosition(doc, pos)
    assert.deepEqual(query, {
      packageName: 'math',
      value: 'Pi',
      from: source.indexOf('math.Pi'),
      to: source.indexOf('math.Pi') + 'math.Pi'.length,
    })
  })
})
