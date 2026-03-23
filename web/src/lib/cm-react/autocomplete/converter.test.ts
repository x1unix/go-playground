import { Text } from '@codemirror/state'
import { assert, describe, test } from 'vitest'
import {
  CompletionItemKind,
  InsertTextFormat,
  type CompletionItem,
  type Hover,
  type Range,
} from 'vscode-languageserver-protocol'

import { completionFromLSPItem, completionTypeFromKind, hoverFromLSP } from './converter'

// Two-line document: "abc\ndef"
// Line 1 from=0: "abc"
// Line 2 from=4: "def"
const doc = Text.of(['abc', 'def'])

const makeRange = (startLine: number, startChar: number, endLine: number, endChar: number): Range => ({
  start: { line: startLine, character: startChar },
  end: { line: endLine, character: endChar },
})

const fallback = { from: 0, to: 0 }

describe('completionFromLSPItem', () => {
  describe('snippet detection', () => {
    test('marks item as snippet when insertTextFormat is Snippet', () => {
      const item: CompletionItem = {
        label: 'iferr',
        insertText: 'if err != nil {\n\treturn ${1:err}\n}',
        kind: CompletionItemKind.Snippet,
        insertTextFormat: InsertTextFormat.Snippet,
      }

      const result = completionFromLSPItem(doc, item, fallback)
      assert.equal(result.insertTextFormat, InsertTextFormat.Snippet)
    })

    test('keeps plain insert text format', () => {
      const item: CompletionItem = {
        label: 'Println',
        insertText: 'Println',
        kind: CompletionItemKind.Function,
        insertTextFormat: InsertTextFormat.PlainText,
      }

      const result = completionFromLSPItem(doc, item, fallback)
      assert.equal(result.insertTextFormat, InsertTextFormat.PlainText)
    })
  })

  describe('additionalTextEdits handling', () => {
    test('keeps additionalTextEdits in LSP format', () => {
      const item: CompletionItem = {
        label: 'Getenv',
        insertText: 'Getenv',
        kind: CompletionItemKind.Function,
        additionalTextEdits: [
          {
            range: makeRange(0, 0, 0, 3),
            newText: 'import "os"\n',
          },
        ],
      }

      const result = completionFromLSPItem(doc, item, fallback)
      assert.isDefined(result.additionalTextEdits)
      assert.lengthOf(result.additionalTextEdits!, 1)
      assert.deepEqual(result.additionalTextEdits, item.additionalTextEdits)
    })

    test('keeps multi-line additionalTextEdit ranges unchanged', () => {
      const item: CompletionItem = {
        label: 'Foo',
        insertText: 'Foo',
        kind: CompletionItemKind.Variable,
        additionalTextEdits: [
          {
            range: makeRange(0, 0, 1, 3),
            newText: 'replaced',
          },
        ],
      }

      const result = completionFromLSPItem(doc, item, fallback)
      assert.deepEqual(result.additionalTextEdits, item.additionalTextEdits)
    })

    test('omits additionalTextEdits property when array is absent', () => {
      const item: CompletionItem = {
        label: 'Plain',
        insertText: 'Plain',
        kind: CompletionItemKind.Variable,
      }

      const result = completionFromLSPItem(doc, item, fallback)
      assert.isUndefined(result.additionalTextEdits)
    })
  })

  describe('range handling', () => {
    test('uses replace range from InsertReplaceEdit pair', () => {
      const item: CompletionItem = {
        label: 'Foo',
        insertText: 'Foo',
        kind: CompletionItemKind.Variable,
        textEdit: {
          newText: 'Foo',
          insert: makeRange(0, 0, 0, 1),
          replace: makeRange(0, 0, 0, 3),
        },
      }

      const result = completionFromLSPItem(doc, item, fallback)
      assert.equal(result.replaceFrom, 0)
      assert.equal(result.replaceTo, 3)
    })

    test('uses range from TextEdit when provided', () => {
      const item: CompletionItem = {
        label: 'Foo',
        insertText: 'Foo',
        kind: CompletionItemKind.Variable,
        textEdit: {
          newText: 'Foo',
          range: makeRange(1, 0, 1, 3),
        },
      }

      const result = completionFromLSPItem(doc, item, fallback)
      assert.equal(result.replaceFrom, 4)
      assert.equal(result.replaceTo, 7)
    })

    test('falls back to provided range when item has no textEdit', () => {
      const item: CompletionItem = {
        label: 'Foo',
        insertText: 'Foo',
        kind: CompletionItemKind.Variable,
      }

      const fb = { from: 5, to: 9 }
      const result = completionFromLSPItem(doc, item, fb)
      assert.equal(result.replaceFrom, 5)
      assert.equal(result.replaceTo, 9)
    })
  })

  describe('insert text fallback', () => {
    test('uses textEdit.newText when insertText is absent', () => {
      const item: CompletionItem = {
        label: 'Printf',
        kind: CompletionItemKind.Function,
        textEdit: {
          newText: 'Printf',
          range: makeRange(0, 0, 0, 3),
        },
      }

      const result = completionFromLSPItem(doc, item, fallback)
      assert.equal(result.insertText, 'Printf')
    })

    test('uses label when both insertText and textEdit are absent', () => {
      const item: CompletionItem = {
        label: 'Println',
        kind: CompletionItemKind.Function,
      }

      const result = completionFromLSPItem(doc, item, fallback)
      assert.equal(result.insertText, 'Println')
    })
  })
})

describe('completionTypeFromKind', () => {
  const cases: Array<[number, string]> = [
    [CompletionItemKind.Function, 'function'],
    [CompletionItemKind.Struct, 'struct'],
    [CompletionItemKind.Module, 'module'],
    [CompletionItemKind.Keyword, 'keyword'],
    [CompletionItemKind.Snippet, 'snippet'],
  ]

  for (const [kind, expectedType] of cases) {
    test(`maps kind ${kind} to type "${expectedType}"`, () => {
      assert.equal(completionTypeFromKind(kind), expectedType)
    })
  }

  test('produces undefined type for unknown kind', () => {
    assert.isUndefined(completionTypeFromKind(999))
  })
})

describe('hoverFromLSP', () => {
  test('converts hover contents and range to HoverResult', () => {
    const hover: Hover = {
      contents: {
        kind: 'markdown',
        value: 'func Println(a ...any) (n int, err error)',
      },
      range: makeRange(0, 0, 0, 3),
    }

    const result = hoverFromLSP(hover, doc)
    assert.isNotNull(result)
    assert.equal(result!.from, 0)
    assert.equal(result!.to, 3)
    assert.deepEqual(result!.contents, {
      kind: 'markdown',
      value: 'func Println(a ...any) (n int, err error)',
    })
  })

  test('accepts plain string contents', () => {
    const hover: Hover = {
      contents: 'plain string',
      range: makeRange(1, 0, 1, 3),
    }

    const result = hoverFromLSP(hover, doc)
    assert.deepEqual(result!.contents, 'plain string')
  })

  test('returns null when contents are empty array', () => {
    const hover: Hover = {
      contents: [],
      range: makeRange(0, 0, 0, 3),
    }

    assert.isNull(hoverFromLSP(hover, doc))
  })

  test('returns null when range is absent', () => {
    const hover: Hover = {
      contents: [{ language: 'go', value: 'func Foo()' }],
    }

    assert.isNull(hoverFromLSP(hover, doc))
  })
})
