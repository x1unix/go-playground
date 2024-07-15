import { MemoryCacheStorage, persistentStore } from '../cache'
import type { GoImportsList } from './types'

const stdlibImportsKey = 'go.imports.stdlib'

/**
 * Provides data sources for autocomplete services.
 */
export class GoCompletionService {
  private readonly storeFacade = new MemoryCacheStorage(persistentStore)

  /**
   * Returns list of known importable Go packages.
   *
   * Returns value from cache if available.
   * @returns
   */
  async getImportSuggestions() {
    // TODO: provide third-party packages using go proxy index.
    return await this.getStandardPackages()
  }

  private async getStandardPackages() {
    const symbols = await this.storeFacade.getItem<GoImportsList>(stdlibImportsKey)
    if (symbols) {
      return symbols.packages
    }

    const rsp = await fetch('/data/imports.json')
    if (!rsp.ok) {
      throw new Error(`${rsp.status} ${rsp.statusText}`)
    }

    const data: GoImportsList = await rsp.json()
    await this.storeFacade.setItem(stdlibImportsKey, data)
    return data
  }
}
