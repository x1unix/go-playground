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
    this.version(2).stores({
      keyValue: 'key',
      completionItems: '++id,label,recordType,prefix,packageName',
    })
  }
}
