import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { assert, describe, test } from 'vitest'
import { InsertTextFormat } from 'vscode-languageserver-protocol'

import type { CompletionItem } from '../types/autocomplete'
import { applyCompletionItem } from './extension'

const withEditor = (doc: string, run: (view: EditorView) => void) => {
  const parent = document.createElement('div')
  document.body.appendChild(parent)
  const view = new EditorView({
    parent,
    state: EditorState.create({
      doc,
    }),
  })

  try {
    run(view)
  } finally {
    view.destroy()
    parent.remove()
  }
}

describe('applyCompletionItem', () => {
  test('expands snippet when completion also has additionalTextEdits', () => {
    const doc = ['package main', '', 'func main() {', '\tos.Readf', '}', ''].join('\n')

    withEditor(doc, (view) => {
      const from = view.state.doc.toString().indexOf('Readf')
      const to = from + 'Readf'.length
      const completion: CompletionItem = {
        label: 'ReadFile',
        insertText: 'ReadFile(${1:name})',
        insertTextFormat: InsertTextFormat.Snippet,
        replaceFrom: from,
        replaceTo: to,
        additionalTextEdits: [
          {
            range: {
              start: {
                line: 1,
                character: 0,
              },
              end: {
                line: 1,
                character: 0,
              },
            },
            newText: 'import "os"\n\n',
          },
        ],
      }

      applyCompletionItem(view, null, from, to, completion)

      const text = view.state.doc.toString()
      assert.include(text, 'import "os"')
      assert.include(text, 'os.ReadFile(name)')
      assert.isFalse(text.includes('${1:name}'))

      const { from: selectionFrom, to: selectionTo } = view.state.selection.main
      assert.equal(view.state.sliceDoc(selectionFrom, selectionTo), 'name')
    })
  })
})
