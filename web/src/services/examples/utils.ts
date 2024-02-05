export const goModFile = 'go.mod'

export const goModTemplate = `
// Replace "example" with your actual Go module name.
// See: https://go.dev/doc/modules/gomod-ref

module example
`.trimStart()

/**
 * Checks if passed workspace requires go.mod file.
 *
 * Returns true if there is a sub-package and no go.mod file.
 * @param files
 */
export const isProjectRequiresGoMod = (files: Record<string, string>) => {
  if (goModFile in files) {
    return false
  }

  for (const fileName in files) {
    if (fileName.includes('/')) {
      return true
    }
  }

  return false
}
