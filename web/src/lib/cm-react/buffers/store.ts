import type { EditorState } from '@codemirror/state'

/**
 * Stores per-document editor state
 */
export class BufferStateStore {
  private readonly states = new Map<string, EditorState>()
  private evictedDocuments = new Set<string>()

  setState(filePath: string, state: EditorState) {
    this.states.set(filePath, state)
  }

  /**
   * Remove buffer from cache.
   *
   * @param markEvicted marks document as evicted until caller calls `unevict`.
   */
  remove(filePath: string, markEvicted?: boolean) {
    this.states.delete(filePath)
    if (markEvicted) {
      this.evictedDocuments.add(filePath)
    }
  }

  get(filePath: string) {
    return this.states.get(filePath)
  }

  /**
   * Removes buffer from eviction list and returns whether buffer was marked for eviction.
   * Used by Editor component to check whether it should persist document state.
   *
   * Document is marked for eviction by the component consumer using `remove` call on file delete.
   */
  unevict(path: string): boolean {
    return this.evictedDocuments.delete(path)
  }

  clear() {
    this.evictedDocuments.clear()
    this.states.clear()
  }
}
