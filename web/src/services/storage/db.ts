import Dexie, { type Table } from 'dexie'
import type { CacheEntry, CompletionRecord } from './types'

/**
 * IndexedDB-based cache implementation.
 */
export class DatabaseStorage extends Dexie {
  keyValue!: Table<CacheEntry, string>
  completionItems!: Table<CompletionRecord, string>

  constructor() {
    super('CacheStore')

    // Init table with 2 indexes:
    //
    // [recordType+packageName+prefix]  - For monaco autocompletion
    // [recordType+packageName+label]   - For hover (codelens)
    this.version(2).stores({
      keyValue: 'key',
      completionItems: '++id,recordType,[recordType+packageName+prefix],[recordType+packageName+label]',
    })
  }
}
