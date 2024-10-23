import { isAfter } from 'date-fns'
import type { DatabaseStorage } from './db'
import type { CacheEntry, CacheStorage } from './types'

type RecordValidator<T> = (entry: CacheEntry<T>) => boolean

export interface CachedValueDescriptor<T> {
  key: string
  ttl: () => Date
  validate?: (entry: CacheEntry<T>) => boolean
  getInitialValue: () => Promise<T>
}

export class KeyValueStore implements CacheStorage {
  constructor(private readonly db: DatabaseStorage) {}

  async getItem<T>(key: string, validate?: RecordValidator<T>): Promise<T | undefined> {
    const entry = await this.db.keyValue.get(key)
    if (entry?.expireAt && isAfter(new Date(), entry.expireAt)) {
      void this.deleteItem(key)
      return undefined
    }

    if (entry && validate && !validate(entry)) {
      void this.deleteItem(key)
      return undefined
    }

    return entry?.value as T | undefined
  }

  async getOrInsert<T>({ ttl, key, validate, getInitialValue }: CachedValueDescriptor<any>) {
    let cachedVal: T | undefined
    try {
      cachedVal = await this.getItem<T>(key, validate)
    } catch (err) {
      console.error(`Failed to get cached record "${key}": ${err}, falling back to default value.`)
    }

    if (typeof cachedVal !== 'undefined') {
      return cachedVal
    }

    const initVal = await getInitialValue()
    try {
      await this.setItem(key, initVal, ttl())
    } catch (err) {
      console.error(`Failed to save cached record "${key}": ${err}`)
    }

    return initVal
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
