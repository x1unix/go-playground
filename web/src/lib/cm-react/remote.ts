import { EditorView } from '@codemirror/view'
import type { DocumentState, EditorRemote } from './types/common'
import type { BufferStateStore } from './buffers/store'
import { getBufferState } from './buffers/state'

type FormatFn = (state: DocumentState) => Promise<string>

export class CMEditorRemote implements EditorRemote {
  editor: EditorView | null = null

  constructor(
    private buffs: BufferStateStore,
    private formatter?: FormatFn,
  ) {}

  setFormatter(formatter?: FormatFn) {
    this.formatter = formatter
  }

  setEditorView(editor: EditorView) {
    this.editor = editor
  }

  private isCurrentDocument(path: string) {
    if (!this.editor) {
      return false
    }

    const buff = getBufferState(this.editor.state)
    if (!buff.isInitialised) {
      return false
    }

    return buff.fileName === path
  }

  forgetDocument(path: string) {
    // Deletion of currently active document will cause a switch to different document.
    // Prevent persist of deleted document using eviction flag.
    const preventPersist = this.isCurrentDocument(path)
    this.buffs.remove(path, preventPersist)
  }

  reset() {
    this.editor = null
  }

  invalidateDocument(path: string) {}
  formatDocument() {}
  focus() {}
  dispose() {}
}
