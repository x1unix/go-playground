/**
 * Returns a new function which appends package name to function/symbol name.
 *
 * @param pkgName Go Package name
 */
export const newPackageSymbolFunc = (pkgName) => (fnName) => `${pkgName}.${fnName}`
