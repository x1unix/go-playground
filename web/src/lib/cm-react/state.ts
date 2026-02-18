import type { EditorState } from '@codemirror/state'

/**
 * Stores per-document editor state
 */
export class BufferStateStore {
  private readonly states = new Map<string, EditorState>()

  setState(filePath: string, state: EditorState) {
    this.states.set(filePath, state)
  }

  remove(filePath: string) {
    this.states.delete(filePath)
  }

  get(filePath: string) {
    return this.states.get(filePath)
  }

  clear() {
    this.states.clear()
  }
}
