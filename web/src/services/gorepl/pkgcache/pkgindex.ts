import type * as packagedb from '~/lib/gowasm/bindings/packagedb'
import { type PackageCacheDB } from '~/services/gorepl/pkgcache/db'

export class PackageIndex implements packagedb.PackageIndex {
  constructor(private readonly db: PackageCacheDB) {}

  async lookupPackage(name: string): Promise<string | null> {
    const result = await this.db.packageIndex.get(name)
    if (!result) {
      return null
    }

    return result.version
  }

  async registerPackage(pkgName: string, version: string) {
    await this.db.packageIndex.put(
      {
        name: pkgName,
        version,
      },
      pkgName,
    )
  }

  async removePackage(pkgName: string): Promise<boolean> {
    // TODO: check affected rows count
    await this.db.packageIndex.delete(pkgName)
    return true
  }
}
