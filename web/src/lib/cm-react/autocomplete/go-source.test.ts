import { Text } from '@codemirror/state'
import { assert, describe, test } from 'vitest'
import type * as monaco from 'monaco-editor'

import { Syntax, type DocumentState } from '../types/common'
import { GoAutocompleteSource } from './go-source'
import { cursorFromOffset } from './utils'

type WorkerQuery = Awaited<ReturnType<InstanceType<typeof GoAutocompleteSource>['complete']>>

const stubRange: monaco.IRange = {
  startLineNumber: 1,
  endLineNumber: 1,
  startColumn: 1,
  endColumn: 1,
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

describe('GoAutocompleteSource', () => {
  test('keeps package suggestion for full literal prefix', async () => {
    const worker = {
      isWarmUp: async () => true,
      getSymbolSuggestions: async () => {
        return [
          {
            label: 'os',
            kind: 8,
            insertText: 'os',
            detail: 'os',
            range: stubRange,
          },
          {
            label: 'close',
            kind: 1,
            insertText: 'close',
            detail: 'close',
            range: stubRange,
          },
        ] as monaco.languages.CompletionItem[]
      },
      getImportSuggestions: async () => [] as monaco.languages.CompletionItem[],
      getBuiltinNames: async () => [] as string[],
      getHoverValue: async () => null,
    } as any

    const source = new GoAutocompleteSource(worker)
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
            kind: 1,
            insertText: 'Environ',
            detail: 'func Environ() []string',
            range: stubRange,
            packagePath: 'os',
          },
        ] as unknown as monaco.languages.CompletionItem[]
      },
      getImportSuggestions: async () => [] as monaco.languages.CompletionItem[],
      getBuiltinNames: async () => [] as string[],
      getHoverValue: async () => null,
    } as any

    const source = new GoAutocompleteSource(worker)
    const doc = newDocument('package main\n\nfunc main(){\n\tos.En\n}\n')
    const offset = doc.text.toString().indexOf('os.En') + 'os.En'.length
    const result = await completeAtOffset(source, doc, offset)

    assert.isNotNull(result)
    assert.equal(result?.options[0]?.label, 'Environ')
    assert.isDefined(result?.options[0]?.additionalTextEdits)
    assert.match(result?.options[0]?.additionalTextEdits?.[0]?.insert ?? '', /import\s+"os"/)
  })
})
