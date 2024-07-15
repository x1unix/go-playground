/**
 * Abstract cache implementation
 */
export interface Storage {
  getItem: <T>(key: string) => Promise<T | undefined>
  deleteItem: (key: string) => Promise<boolean>
  setItem: <T>(key: string, value: T) => Promise<void>
  flush: () => Promise<void>
}
