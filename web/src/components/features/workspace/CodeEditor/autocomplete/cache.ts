import type * as monaco from 'monaco-editor'
import type { ImportsContext } from '~/workers/language/types'
import { buildImportContext } from './parser/imports'
import { stripSlash } from './utils'

/**
 * Stores document metadata (such as symbols, imports) in cache.
 */
export class DocumentMetadataCache {
  private readonly cache = new Map<string, ImportsContext>()

  /**
   * Flush cache contents.
   *
   * If fileName is not empty, flushes only record for specified file name.
   */
  flush(fileName?: string) {
    if (fileName) {
      this.cache.delete(fileName)
      return
    }

    this.cache.clear()
  }

  /**
   * Invalidates cache if document is changed in imports range.
   */
  handleUpdate(fileName: string, event: monaco.editor.IModelContentChangedEvent) {
    const entry = this.cache.get(fileName)
    if (!entry) {
      return
    }

    if (event.isFlush || !entry.totalRange) {
      this.cache.delete(fileName)
      return
    }

    const { totalRange } = entry
    for (const change of event.changes) {
      const { startLineNumber } = change.range

      if (startLineNumber >= totalRange.startLineNumber && startLineNumber <= totalRange.endLineNumber) {
        this.cache.delete(fileName)
        return
      }
    }
  }

  /**
   * Returns document imports metadata from context.
   *
   * Populates data from model if it's not cached.
   */
  getMetadata(model: monaco.editor.ITextModel) {
    // model file name has slash at root
    const fileName = stripSlash(model.uri.path)

    const data = this.cache.get(fileName)
    if (data && !data.hasError) {
      return data
    }

    return this.updateCache(fileName, model)
  }

  private updateCache(fileName: string, model: monaco.editor.ITextModel) {
    const context = buildImportContext(model)
    this.cache.set(fileName, context)
    return context
  }
}
