import { isAfter } from 'date-fns'
import type { DatabaseStorage } from './db'
import type { CacheStorage } from './types'

export class KeyValueStore implements CacheStorage {
  constructor(private readonly db: DatabaseStorage) {}

  async getItem<T>(key: string): Promise<T | undefined> {
    const entry = await this.db.keyValue.get(key)
    if (entry?.expireAt && isAfter(new Date(), entry.expireAt)) {
      void this.deleteItem(key)
      return undefined
    }

    return entry?.value as T | undefined
  }

  async deleteItem(key: string) {
    const n = await this.db.keyValue.where({ key }).delete()
    return n > 0
  }

  async setItem<T>(key: string, value: T, expireAt?: Date) {
    await this.deleteItem(key)
    await this.db.keyValue.put({ key, value, expireAt })
  }

  async flush() {
    await this.db.keyValue.clear()
  }
}
