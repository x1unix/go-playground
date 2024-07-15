import type { Storage } from './types'

export class MemoryCacheStorage implements Storage {
  private readonly cache = new Map<string, any>()

  constructor(private readonly backend?: Storage) {}

  async getItem<T>(key: string): Promise<T | undefined> {
    let found = this.cache.get(key)
    if (found) {
      return found
    }

    found = await this.backend?.getItem(key)
    if (found) {
      this.cache.set(key, found)
    }

    return found
  }

  async deleteItem(key: string) {
    const hasItem = this.cache.has(key)
    this.cache.delete(key)
    return (await this.backend?.deleteItem(key)) ?? hasItem
  }

  async setItem<T>(key: string, value: T, expireAt?: Date) {
    await this.backend?.setItem(key, value, expireAt)
    this.cache.set(key, value)
  }

  async flush() {
    await this.backend?.flush()
    this.cache.clear()
  }
}
