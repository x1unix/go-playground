import Dexie, { type EntityTable } from 'dexie'
import type { Storage } from './types'

interface CacheEntry<T = any> {
  key: string
  value: T
}

type CacheDB = Dexie & EntityTable<CacheEntry, 'key'>

const tableName = 'entries'

/**
 * IndexedDB-based cache implementation.
 */
export class DatabaseStorage implements Storage {
  private readonly db = new Dexie('CacheStore') as CacheDB

  constructor() {
    this.db.version(1).stores({
      [tableName]: 'key',
    })
  }

  async getItem<T>(key: string): Promise<T | undefined> {
    const entry = await this.db.table(tableName).get(key)
    return entry?.value as T | undefined
  }

  async deleteItem(key: string) {
    const n = await this.db.table(tableName).where({ key }).delete()
    return n > 0
  }

  async setItem<T>(key: string, value: T) {
    await this.deleteItem(key)
    await this.db.table(tableName).put({ key, value })
  }

  async flush() {
    await this.db.table(tableName).clear()
  }
}
