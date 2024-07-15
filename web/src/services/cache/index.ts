import { DatabaseStorage } from './db'

export * from './db'
export * from './memory'
export type { Storage } from './types'

export const persistentStore = new DatabaseStorage()
