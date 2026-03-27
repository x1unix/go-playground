import { parser } from '@lezer/go'
import { Text } from '@codemirror/state'
import { assert, describe, test, vi } from 'vitest'

import { Syntax } from '../types/common'
import { queryFromPosition } from './hover'

const newDoc = (source: string) => ({
  path: 'main.go',
  language: Syntax.Go,
  text: Text.of(source.split('\n')),
})

describe('hover queryFromPosition', () => {
  test('resolves builtin make query', () => {
    const source = 'package main\n\nfunc main() {\n\tm := make(map[string]int)\n}\n'
    const doc = newDoc(source)
    const pos = source.indexOf('make') + 1

    const query = queryFromPosition(doc, pos)
    assert.deepEqual(query, {
      value: 'make',
      from: source.indexOf('make'),
      to: source.indexOf('make') + 'make'.length,
    })
  })

  test('resolves builtin new query', () => {
    const source = 'package main\n\nfunc main() {\n\tv := new(int)\n\t_ = v\n}\n'
    const doc = newDoc(source)
    const pos = source.indexOf('new') + 1

    const query = queryFromPosition(doc, pos)
    assert.deepEqual(query, {
      value: 'new',
      from: source.indexOf('new'),
      to: source.indexOf('new') + 'new'.length,
    })
  })

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

  test('uses provided tree without reparsing', () => {
    const source = 'package main\n\nfunc main() {\n\tfmt.Println("x")\n}\n'
    const doc = newDoc(source)
    const pos = source.indexOf('Println') + 1
    const tree = parser.parse(source)
    const parseSpy = vi.spyOn(parser, 'parse')

    try {
      const query = queryFromPosition(doc, pos, tree)
      assert.deepEqual(query, {
        packageName: 'fmt',
        value: 'Println',
        from: source.indexOf('fmt'),
        to: source.indexOf('Println') + 'Println'.length,
      })
      assert.equal(parseSpy.mock.calls.length, 0)
    } finally {
      parseSpy.mockRestore()
    }
  })

  test('falls back to parsing when tree is null', () => {
    const source = 'package main\n\nfunc main() {\n\tfmt.Println("x")\n}\n'
    const doc = newDoc(source)
    const pos = source.indexOf('Println') + 1
    const parseSpy = vi.spyOn(parser, 'parse')

    try {
      const query = queryFromPosition(doc, pos, null)
      assert.deepEqual(query, {
        packageName: 'fmt',
        value: 'Println',
        from: source.indexOf('fmt'),
        to: source.indexOf('Println') + 'Println'.length,
      })
      assert.equal(parseSpy.mock.calls.length, 1)
    } finally {
      parseSpy.mockRestore()
    }
  })

  test('falls back to parsing when tree is undefined', () => {
    const source = 'package main\n\nfunc main() {\n\tfmt.Println("x")\n}\n'
    const doc = newDoc(source)
    const pos = source.indexOf('Println') + 1
    const parseSpy = vi.spyOn(parser, 'parse')

    try {
      const query = queryFromPosition(doc, pos)
      assert.deepEqual(query, {
        packageName: 'fmt',
        value: 'Println',
        from: source.indexOf('fmt'),
        to: source.indexOf('Println') + 'Println'.length,
      })
      assert.equal(parseSpy.mock.calls.length, 1)
    } finally {
      parseSpy.mockRestore()
    }
  })
})
