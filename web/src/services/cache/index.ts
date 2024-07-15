import { DatabaseStorage } from './db'

export * from './db'
export * from './memory'
export * from './types'

export const persistentStore = new DatabaseStorage()
