import { DatabaseStorage } from './db'
import { KeyValueStore } from './kv'

export type * from './db'

export const db = new DatabaseStorage()
export const keyValue = new KeyValueStore(db)
