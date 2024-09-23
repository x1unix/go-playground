import { db, keyValue } from '../storage'
import { type CompletionRecord, CompletionRecordType } from '../storage/types'
import type { GoImportsFile, SuggestionQuery } from './types'
import { buildCompletionRecord, completionRecordsFromMap, importRecordsIntoSymbols, buildTableQuery } from './utils'

const completionVersionKey = 'completionItems.version'

/**
 * Provides data sources for autocomplete services.
 */
export class GoCompletionService {
  private cachePopulated = false

  /**
   * Store keeps completions in cache.
   *
   * Using in-memory cache doesn't make sense as Monaco mutates completions after submit.
   * Completions with mutated position are no longer validated, so either each new copy should be done
   * or it's much easier to just query the DB.
   */
  private readonly db = db
  private readonly keyValue = keyValue

  /**
   * Returns whether cache was previously populated.
   */
  isWarmUp() {
    return this.cachePopulated
  }

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

  /**
   * Returns symbol or literal suggestions by prefix and package name.
   */
  async getSymbolSuggestions(query: SuggestionQuery) {
    await this.checkCacheReady()

    const { keys, values } = buildTableQuery(query)
    const results = await this.db.completionItems.where(keys).equals(values).sortBy('label')
    return results
  }

  private async getStandardPackages() {
    await this.checkCacheReady()
    const symbols = await this.db.completionItems.where('recordType').equals(CompletionRecordType.ImportPath).toArray()
    return symbols
  }

  private async checkCacheReady() {
    if (this.cachePopulated) {
      return true
    }

    // TODO: add invalidation by Go version
    const version = await this.keyValue.getItem<string>(completionVersionKey)
    if (!version) {
      await this.populateCache()
      return true
    }

    const count = await this.db.completionItems.count()
    this.cachePopulated = count > 0
    if (!this.cachePopulated) {
      await this.populateCache()
    }
    return this.cachePopulated
  }

  private async populateCache() {
    const rsp = await fetch('/data/imports.json')
    if (!rsp.ok) {
      throw new Error(`${rsp.status} ${rsp.statusText}`)
    }

    const data: GoImportsFile = await rsp.json()

    // Completion options for import paths and package names are 2 separate records.
    const importPaths = data.packages.map((pkg) => buildCompletionRecord(pkg, CompletionRecordType.ImportPath))
    const records: CompletionRecord[] = [
      ...importPaths,
      ...completionRecordsFromMap(data.symbols),
      ...importRecordsIntoSymbols(data.packages),
    ]

    await Promise.all([
      this.db.completionItems.clear(),
      this.db.completionItems.bulkAdd(records),
      this.keyValue.setItem(completionVersionKey, data.format),
    ])

    this.cachePopulated = true
  }
}
