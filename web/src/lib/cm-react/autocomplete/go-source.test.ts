import { Text } from '@codemirror/state'
import { assert, describe, test } from 'vitest'
import {
  CompletionItemKind,
  type CompletionItem as LSPCompletionItem,
  type Hover,
  type Range,
} from 'vscode-languageserver-protocol'

import { Syntax, type DocumentState } from '../types/common'
import { GoAutocompleteSource } from './go-source'
import { cursorFromOffset } from './utils'

type WorkerQuery = Awaited<ReturnType<InstanceType<typeof GoAutocompleteSource>['complete']>>

const stubRange: Range = {
  start: {
    line: 0,
    character: 0,
  },
  end: {
    line: 0,
    character: 0,
  },
}

const newDocument = (content: string): DocumentState => ({
  path: 'main.go',
  language: Syntax.Go,
  text: Text.of(content.split('\n')),
})

const completeAtOffset = async (
  source: GoAutocompleteSource,
  doc: DocumentState,
  offset: number,
): Promise<WorkerQuery> => {
  return await source.complete({
    document: doc,
    cursor: cursorFromOffset(doc.text, offset),
    explicit: true,
  })
}

const hoverAtOffset = async (source: GoAutocompleteSource, doc: DocumentState, offset: number) => {
  return await source.hover({
    document: doc,
    cursor: cursorFromOffset(doc.text, offset),
  })
}

const withWorkerRef = (worker: any) => ({
  acquire: async <TResult>(callback: (value: any) => Promise<TResult> | TResult) => await callback(worker),
})

describe('GoAutocompleteSource', () => {
  test('supports only Go syntax', () => {
    const worker = {} as any
    const source = new GoAutocompleteSource(withWorkerRef(worker) as any)

    assert.isTrue(source.supportsSyntax(Syntax.Go))
    assert.isFalse(source.supportsSyntax(Syntax.GoMod))
    assert.isFalse(source.supportsSyntax(Syntax.JSON))
    assert.isFalse(source.supportsSyntax(Syntax.PlainText))
  })

  test('keeps package suggestion for full literal prefix', async () => {
    const worker = {
      isWarmUp: async () => true,
      getSymbolSuggestions: async () => {
        return [
          {
            label: 'os',
            kind: CompletionItemKind.Module,
            insertText: 'os',
            detail: 'os',
          },
          {
            label: 'close',
            kind: CompletionItemKind.Function,
            insertText: 'close',
            detail: 'close',
          },
        ] as LSPCompletionItem[]
      },
      getImportSuggestions: async () => [] as LSPCompletionItem[],
      getBuiltinNames: async () => [] as string[],
      getHoverValue: async () => null,
    } as any

    const source = new GoAutocompleteSource(withWorkerRef(worker) as any)
    const doc = newDocument('package main\n\nfunc main(){\n\tos\n}\n')
    const offset = doc.text.toString().indexOf('os') + 'os'.length
    const result = await completeAtOffset(source, doc, offset)

    assert.isNotNull(result)
    assert.deepEqual(
      result?.options.map((item) => item.label),
      ['os'],
    )
  })

  test('adds import edit for package member completion when package is not imported', async () => {
    const worker = {
      isWarmUp: async () => true,
      getSymbolSuggestions: async () => {
        return [
          {
            label: 'Environ',
            kind: CompletionItemKind.Function,
            insertText: 'Environ',
            detail: 'func Environ() []string',
            data: {
              packagePath: 'os',
            },
          },
        ] as LSPCompletionItem[]
      },
      getImportSuggestions: async () => [] as LSPCompletionItem[],
      getBuiltinNames: async () => [] as string[],
      getHoverValue: async () => null,
    } as any

    const source = new GoAutocompleteSource(withWorkerRef(worker) as any)
    const doc = newDocument('package main\n\nfunc main(){\n\tos.En\n}\n')
    const offset = doc.text.toString().indexOf('os.En') + 'os.En'.length
    const result = await completeAtOffset(source, doc, offset)

    assert.isNotNull(result)
    assert.equal(result?.options[0]?.label, 'Environ')
    assert.isDefined(result?.options[0]?.additionalTextEdits)
    assert.match(result?.options[0]?.additionalTextEdits?.[0]?.newText ?? '', /import\s+"os"/)
  })

  test('resolves import aliases for member completion query', async () => {
    let capturedQuery: any

    const worker = {
      isWarmUp: async () => true,
      getSymbolSuggestions: async (query: any) => {
        capturedQuery = query
        return [
          {
            label: 'StdEncoding',
            kind: CompletionItemKind.Variable,
            insertText: 'StdEncoding',
            detail: 'var StdEncoding *Encoding',
          },
        ] as LSPCompletionItem[]
      },
      getImportSuggestions: async () => [] as LSPCompletionItem[],
      getBuiltinNames: async () => [] as string[],
      getHoverValue: async () => null,
    } as any

    const source = new GoAutocompleteSource(withWorkerRef(worker) as any)
    const doc = newDocument(
      ['package main', 'import (', '\tb64 "encoding/base64"', ')', '', 'func main() {', '\tb64.St', '}', ''].join('\n'),
    )
    const offset = doc.text.toString().indexOf('b64.St') + 'b64.St'.length

    await completeAtOffset(source, doc, offset)

    assert.isNotNull(capturedQuery)
    assert.equal(capturedQuery.packageName, 'encoding/base64')
  })

  test('resolves import aliases for hover query', async () => {
    let capturedQuery: any

    const worker = {
      isWarmUp: async () => true,
      getSymbolSuggestions: async () => [] as LSPCompletionItem[],
      getImportSuggestions: async () => [] as LSPCompletionItem[],
      getBuiltinNames: async () => [] as string[],
      getHoverValue: async (query: any) => {
        capturedQuery = query
        return {
          contents: [],
          range: stubRange,
        } as Hover
      },
    } as any

    const source = new GoAutocompleteSource(withWorkerRef(worker) as any)
    const doc = newDocument(
      [
        'package main',
        'import (',
        '\tb64 "encoding/base64"',
        ')',
        '',
        'func main() {',
        '\tsEnc := b64.StdEncoding.EncodeToString([]byte("abc"))',
        '\t_ = sEnc',
        '}',
        '',
      ].join('\n'),
    )
    const offset = doc.text.toString().indexOf('StdEncoding') + 1

    await hoverAtOffset(source, doc, offset)

    assert.isNotNull(capturedQuery)
    assert.equal(capturedQuery.packageName, 'encoding/base64')
    assert.equal(capturedQuery.value, 'StdEncoding')
  })
})
