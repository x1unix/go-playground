import Dexie, { type EntityTable } from 'dexie'
import { isAfter } from 'date-fns'
import type { Storage } from './types'

interface CacheEntry<T = any> {
  key: string
  value: T
  expireAt?: Date
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
    if (entry?.expireAt && isAfter(new Date(), entry.expireAt)) {
      void this.deleteItem(key)
      return undefined
    }

    return entry?.value as T | undefined
  }

  async deleteItem(key: string) {
    const n = await this.db.table(tableName).where({ key }).delete()
    return n > 0
  }

  async setItem<T>(key: string, value: T, expireAt?: Date) {
    await this.deleteItem(key)
    await this.db.table(tableName).put({ key, value, expireAt })
  }

  async flush() {
    await this.db.table(tableName).clear()
  }
}
