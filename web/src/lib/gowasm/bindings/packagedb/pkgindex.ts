/**
 * Package index interface
 */
export interface PackageIndex {
  /**
   * Looks up for a package and returns its version.
   * Returns null if no package was found in cache.
   *
   * @param name Package name
   */
  lookupPackage: (name: string) => Promise<string | null>

  /**
   * Registers or updates an existing package information in index.
   *
   * @param pkgName Package name
   * @param version Version
   */
  registerPackage: (pkgName: string, version: string) => Promise<void>

  /**
   * Removes package from index.
   * Returns false if package didn't exist.
   *
   * @param pkgName Package name
   */
  removePackage: (pkgName: string) => Promise<boolean>
}
