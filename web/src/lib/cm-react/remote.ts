import { EditorView } from '@codemirror/view'
import type { DocumentState, EditorRemote } from './types'

type FormatFn = (state: DocumentState) => Promise<string>

export class CMEditorRemote implements EditorRemote {
  editor: EditorView | null = null

  constructor(private formatter?: FormatFn) {}

  setFormatter(formatter?: FormatFn) {
    this.formatter = formatter
  }

  setEditorView(editor: EditorView) {
    this.editor = editor
  }

  reset() {
    this.editor = null
  }

  invalidateDocument(path: string) {}
  formatDocument() {}
  focus() {}
  dispose() {}
}
