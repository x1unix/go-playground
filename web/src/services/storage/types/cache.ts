export interface CacheEntry<T = any> {
  key: string
  value: T
  expireAt?: Date
}

/**
 * Abstract cache implementation
 */
export interface CacheStorage {
  /**
   * Return an item by key.
   *
   * Returns nothing if TTL is expired.
   */
  getItem: <T>(key: string) => Promise<T | undefined>

  /**
   * Remove an item by key.
   *
   * Returns whether deletion affected any record.
   */
  deleteItem: (key: string) => Promise<boolean>

  /**
   * Store an item
   * @param key Item key
   * @param value Value
   * @param expireAt Key expiration date.
   */
  setItem: <T>(key: string, value: T, expireAt?: Date) => Promise<void>

  /**
   * Truncate storage.
   */
  flush: () => Promise<void>
}
