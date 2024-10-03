import Dexie, { type Table } from 'dexie'
import type { CacheEntry, PackageIndexItem, SymbolIndexItem } from './types'

/**
 * IndexedDB-based cache implementation.
 */
export class DatabaseStorage extends Dexie {
  keyValue!: Table<CacheEntry, string>
  packageIndex!: Table<PackageIndexItem, string>
  symbolIndex!: Table<SymbolIndexItem, string>

  constructor() {
    super('CacheStore')

    this.version(2).stores({
      keyValue: 'key',
      packageIndex: 'importPath, prefix, name',
      symbolIndex: 'key, packagePath, [packageName+prefix], [packageName+label], [packagePath+prefix]',
    })
  }
}
