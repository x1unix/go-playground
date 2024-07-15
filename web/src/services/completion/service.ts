import { addDays } from 'date-fns'
import { persistentStore } from '../cache'
import type { GoImportsList } from './types'

const stdlibImportsKey = 'go.imports.stdlib'

const TTL_DAYS = 7

const getExpireTime = () => addDays(new Date(), TTL_DAYS)

/**
 * Provides data sources for autocomplete services.
 */
export class GoCompletionService {
  private cacheWarmUp = false

  /**
   * Store keeps completions in cache.
   *
   * Using MemoryCacheStorage doesn't make sense as Monaco mutates completions after submit.
   * Completions with mutated position are no longer validated, so either each new copy should be done
   * or it's much easier to just query the DB.
   */
  private readonly store = persistentStore

  /**
   * Returns list of known importable Go packages.
   *
   * Returns value from cache if available.
   * @returns
   */
  async getImportSuggestions() {
    // TODO: provide third-party packages using go proxy index.
    const stdlib = await this.getStandardPackages()
    return stdlib.packages
  }

  isWarmUp() {
    return this.cacheWarmUp
  }

  private async getStandardPackages() {
    const symbols = await this.store.getItem<GoImportsList>(stdlibImportsKey)
    if (symbols) {
      this.cacheWarmUp = true
      return symbols
    }

    const rsp = await fetch('/data/imports.json')
    if (!rsp.ok) {
      throw new Error(`${rsp.status} ${rsp.statusText}`)
    }

    const data: GoImportsList = await rsp.json()
    await this.store.setItem(stdlibImportsKey, data, getExpireTime())
    return data
  }
}
