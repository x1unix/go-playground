import { Text } from '@codemirror/state'
import { assert, describe, test } from 'vitest'
import type * as monaco from 'monaco-editor'

import { completionFromMonacoItem, hoverFromMonaco } from './converter'

// Two-line document: "abc\ndef"
// Line 1 from=0: "abc"  (cols 1-4)
// Line 2 from=4: "def"  (cols 1-4)
const doc = Text.of(['abc', 'def'])

const makeRange = (
  startLineNumber: number,
  startColumn: number,
  endLineNumber: number,
  endColumn: number,
): monaco.IRange => ({ startLineNumber, startColumn, endLineNumber, endColumn })

const fallback = { from: 0, to: 0 }

describe('completionFromMonacoItem', () => {
  describe('snippet detection', () => {
    test('marks item as snippet when insertTextRules has bit 4 set', () => {
      const item: monaco.languages.CompletionItem = {
        label: 'iferr',
        insertText: 'if err != nil {\n\treturn ${1:err}\n}',
        kind: 27,
        insertTextRules: 4,
        range: makeRange(1, 1, 1, 1),
      }
      const result = completionFromMonacoItem(doc, item, fallback)
      assert.isTrue(result.isSnippet)
    })

    test('marks item as snippet when insertTextRules has bit 4 among other bits', () => {
      const item: monaco.languages.CompletionItem = {
        label: 'switch',
        insertText: 'switch ${1:expr} {\n\tcase $0:\n}',
        kind: 27,
        insertTextRules: 5, // bits 0 and 2 (4 | 1)
        range: makeRange(1, 1, 1, 1),
      }
      const result = completionFromMonacoItem(doc, item, fallback)
      assert.isTrue(result.isSnippet)
    })

    test('does not mark item as snippet when insertTextRules lacks bit 4', () => {
      const item: monaco.languages.CompletionItem = {
        label: 'Println',
        insertText: 'Println',
        kind: 1,
        insertTextRules: 2,
        range: makeRange(1, 1, 1, 1),
      }
      const result = completionFromMonacoItem(doc, item, fallback)
      assert.isFalse(!!result.isSnippet)
    })

    test('does not mark item as snippet when insertTextRules is absent', () => {
      const item: monaco.languages.CompletionItem = {
        label: 'Println',
        insertText: 'Println',
        kind: 1,
        range: makeRange(1, 1, 1, 1),
      }
      const result = completionFromMonacoItem(doc, item, fallback)
      assert.isFalse(!!result.isSnippet)
    })
  })

  describe('additionalTextEdits conversion', () => {
    test('converts additionalTextEdits to CompletionTextEdit entries', () => {
      // Edit: replace "abc" on line 1 with `import "os"\n`
      const item: monaco.languages.CompletionItem = {
        label: 'Getenv',
        insertText: 'Getenv',
        kind: 1,
        range: makeRange(1, 1, 1, 4),
        additionalTextEdits: [
          {
            range: makeRange(1, 1, 1, 4),
            text: 'import "os"\n',
          },
        ],
      }
      const result = completionFromMonacoItem(doc, item, fallback)
      assert.isDefined(result.additionalTextEdits)
      assert.lengthOf(result.additionalTextEdits!, 1)

      const edit = result.additionalTextEdits![0]
      // line 1, col 1 → offset 0; line 1, col 4 → offset 3
      assert.equal(edit.from, 0)
      assert.equal(edit.to, 3)
      assert.equal(edit.insert, 'import "os"\n')
    })

    test('converts multi-line additionalTextEdit range to correct offsets', () => {
      // Edit spans from line 1 col 1 to line 2 col 4 (entire "abc\ndef")
      const item: monaco.languages.CompletionItem = {
        label: 'Foo',
        insertText: 'Foo',
        kind: 4,
        range: makeRange(1, 1, 1, 1),
        additionalTextEdits: [
          {
            range: makeRange(1, 1, 2, 4),
            text: 'replaced',
          },
        ],
      }
      const result = completionFromMonacoItem(doc, item, fallback)
      const edit = result.additionalTextEdits![0]
      // line 1, col 1 → 0; line 2, col 4 → 4 + 4 - 1 = 7
      assert.equal(edit.from, 0)
      assert.equal(edit.to, 7)
      assert.equal(edit.insert, 'replaced')
    })

    test('filters out additionalTextEdits with missing range', () => {
      const item: monaco.languages.CompletionItem = {
        label: 'Bar',
        insertText: 'Bar',
        kind: 4,
        range: makeRange(1, 1, 1, 1),
        additionalTextEdits: [
          { range: undefined as any, text: 'should be dropped' },
          { range: makeRange(2, 1, 2, 4), text: 'kept' },
        ],
      }
      const result = completionFromMonacoItem(doc, item, fallback)
      assert.isDefined(result.additionalTextEdits)
      assert.lengthOf(result.additionalTextEdits!, 1)
      assert.equal(result.additionalTextEdits![0].insert, 'kept')
    })

    test('uses empty string when edit text is null', () => {
      const item: monaco.languages.CompletionItem = {
        label: 'Baz',
        insertText: 'Baz',
        kind: 4,
        range: makeRange(1, 1, 1, 1),
        additionalTextEdits: [{ range: makeRange(1, 1, 1, 4), text: null as any }],
      }
      const result = completionFromMonacoItem(doc, item, fallback)
      assert.equal(result.additionalTextEdits![0].insert, '')
    })

    test('omits additionalTextEdits property when all edits are filtered out', () => {
      const item: monaco.languages.CompletionItem = {
        label: 'Qux',
        insertText: 'Qux',
        kind: 4,
        range: makeRange(1, 1, 1, 1),
        additionalTextEdits: [{ range: undefined as any, text: 'dropped' }],
      }
      const result = completionFromMonacoItem(doc, item, fallback)
      assert.isUndefined(result.additionalTextEdits)
    })

    test('omits additionalTextEdits property when array is absent', () => {
      const item: monaco.languages.CompletionItem = {
        label: 'Plain',
        insertText: 'Plain',
        kind: 4,
        range: makeRange(1, 1, 1, 1),
      }
      const result = completionFromMonacoItem(doc, item, fallback)
      assert.isUndefined(result.additionalTextEdits)
    })
  })

  describe('range handling', () => {
    test('uses replace range from CompletionItemRanges pair', () => {
      const item: monaco.languages.CompletionItem = {
        label: 'Foo',
        insertText: 'Foo',
        kind: 4,
        range: {
          insert: makeRange(1, 1, 1, 2),
          replace: makeRange(1, 1, 1, 4),
        },
      }
      const result = completionFromMonacoItem(doc, item, fallback)
      // replace: line 1, col 1 → 0; col 4 → 3
      assert.equal(result.replaceFrom, 0)
      assert.equal(result.replaceTo, 3)
    })

    test('uses plain IRange when provided', () => {
      const item: monaco.languages.CompletionItem = {
        label: 'Foo',
        insertText: 'Foo',
        kind: 4,
        range: makeRange(2, 1, 2, 4),
      }
      const result = completionFromMonacoItem(doc, item, fallback)
      // line 2, col 1 → 4; col 4 → 7
      assert.equal(result.replaceFrom, 4)
      assert.equal(result.replaceTo, 7)
    })

    test('falls back to provided range when item has no range', () => {
      const item: monaco.languages.CompletionItem = {
        label: 'Foo',
        insertText: 'Foo',
        kind: 4,
        range: undefined as any,
      }
      const fb = { from: 5, to: 9 }
      const result = completionFromMonacoItem(doc, item, fb)
      assert.equal(result.replaceFrom, 5)
      assert.equal(result.replaceTo, 9)
    })
  })

  describe('label handling', () => {
    test('uses string label directly', () => {
      const item: monaco.languages.CompletionItem = {
        label: 'Println',
        insertText: 'Println',
        kind: 1,
        range: makeRange(1, 1, 1, 1),
      }
      assert.equal(completionFromMonacoItem(doc, item, fallback).label, 'Println')
    })

    test('uses label.label when label is an object', () => {
      const item: monaco.languages.CompletionItem = {
        label: { label: 'Printf', description: 'fmt' },
        insertText: 'Printf',
        kind: 1,
        range: makeRange(1, 1, 1, 1),
      }
      assert.equal(completionFromMonacoItem(doc, item, fallback).label, 'Printf')
    })
  })

  describe('kind-to-type mapping', () => {
    const cases: Array<[number, string]> = [
      [1, 'function'],
      [6, 'struct'],
      [8, 'module'],
      [17, 'keyword'],
      [27, 'snippet'],
    ]

    for (const [kind, expectedType] of cases) {
      test(`maps kind ${kind} to type "${expectedType}"`, () => {
        const item: monaco.languages.CompletionItem = {
          label: 'x',
          insertText: 'x',
          kind,
          range: makeRange(1, 1, 1, 1),
        }
        assert.equal(completionFromMonacoItem(doc, item, fallback).type, expectedType)
      })
    }

    test('produces undefined type for unknown kind', () => {
      const item: monaco.languages.CompletionItem = {
        label: 'x',
        insertText: 'x',
        kind: 999,
        range: makeRange(1, 1, 1, 1),
      }
      assert.isUndefined(completionFromMonacoItem(doc, item, fallback).type)
    })
  })
})

describe('hoverFromMonaco', () => {
  test('converts hover contents and range to HoverResult', () => {
    const hover: monaco.languages.Hover = {
      contents: [{ value: 'func Println(a ...any) (n int, err error)' }],
      range: makeRange(1, 1, 1, 4),
    }
    const result = hoverFromMonaco(hover, doc)
    assert.isNotNull(result)
    assert.equal(result!.from, 0)
    assert.equal(result!.to, 3)
    assert.deepEqual(result!.contents, ['func Println(a ...any) (n int, err error)'])
  })

  test('joins multiple non-empty markdown strings', () => {
    const hover: monaco.languages.Hover = {
      contents: [{ value: 'signature' }, { value: 'documentation' }, { value: '' }],
      range: makeRange(1, 1, 1, 4),
    }
    const result = hoverFromMonaco(hover, doc)
    assert.deepEqual(result!.contents, ['signature', 'documentation'])
  })

  test('accepts plain string contents', () => {
    const hover: monaco.languages.Hover = {
      contents: ['plain string'],
      range: makeRange(2, 1, 2, 4),
    }
    const result = hoverFromMonaco(hover, doc)
    assert.deepEqual(result!.contents, ['plain string'])
  })

  test('returns null when all contents are empty', () => {
    const hover: monaco.languages.Hover = {
      contents: [{ value: '' }, { value: '' }],
      range: makeRange(1, 1, 1, 4),
    }
    assert.isNull(hoverFromMonaco(hover, doc))
  })

  test('returns null when range is absent', () => {
    const hover: monaco.languages.Hover = {
      contents: [{ value: 'something' }],
    }
    assert.isNull(hoverFromMonaco(hover, doc))
  })
})
