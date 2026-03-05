import type { ImportsContext } from '~/workers/language/types'
import type { DocumentState } from '../types/common'
import type { DocumentUpdate } from '../types/autocomplete'

import { buildImportContext } from './imports'

export class DocumentMetadataCache {
  private readonly cache = new Map<string, ImportsContext>()

  flush(fileName?: string) {
    if (fileName) {
      this.cache.delete(fileName)
      return
    }

    this.cache.clear()
  }

  handleUpdate({ path, changes, isFlush }: DocumentUpdate) {
    const entry = this.cache.get(path)
    if (!entry) {
      return
    }

    if (isFlush || !entry.totalRange) {
      this.cache.delete(path)
      return
    }

    const { totalRange } = entry
    for (const change of changes) {
      if (change.endLineNumber < totalRange.startLineNumber) {
        continue
      }

      if (change.startLineNumber > totalRange.endLineNumber) {
        continue
      }

      this.cache.delete(path)
      return
    }
  }

  getMetadata(doc: DocumentState) {
    const data = this.cache.get(doc.path)
    if (data && !data.hasError) {
      return data
    }

    const context = buildImportContext(doc)
    this.cache.set(doc.path, context)
    return context
  }
}
