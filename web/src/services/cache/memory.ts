import type { Storage } from './types'

export class MemoryCacheStorage implements Storage {
  private readonly cache = new Map<string, any>()

  constructor(private readonly backend?: Storage) {}

  async getItem<T>(key: string): Promise<T | undefined> {
    return this.cache.get(key) ?? (await this.backend?.getItem(key))
  }

  async deleteItem(key: string) {
    const hasItem = this.cache.has(key)
    this.cache.delete(key)
    return (await this.backend?.deleteItem(key)) ?? hasItem
  }

  async setItem<T>(key: string, value: T) {
    await this.backend?.setItem(key, value)
    this.cache.set(key, value)
  }

  async flush() {
    await this.backend?.flush()
    this.cache.clear()
  }
}
