import type * as monaco from 'monaco-editor'
import { db, keyValue } from '../storage'
import type { GoIndexFile, HoverQuery, LiteralQuery, PackageSymbolQuery, SuggestionQuery } from './types'
import {
  completionFromPackage,
  completionFromSymbol,
  constructPackages,
  constructSymbols,
  findPackagePathFromContext,
  importCompletionFromPackage,
  symbolHoverDoc,
} from './utils'
import { type SymbolIndexItem } from '~/services/storage/types'

const completionVersionKey = 'completionItems.version'

const isPackageQuery = (q: SuggestionQuery): q is PackageSymbolQuery => 'packageName' in q

/**
 * Provides data sources for autocomplete services.
 */
export class GoCompletionService {
  private cachePopulated = false
  private populatePromise?: Promise<void>

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
   * Returns list of predefined builtins.
   *
   * Used to speed-up hover operations.
   */
  async getBuiltinNames() {
    await this.checkCacheReady()
    const items = await this.db.symbolIndex.where({ packageName: 'builtin' }).toArray()
    return items.map(({ label }) => label)
  }

  private buildHoverFilter(query: HoverQuery): Partial<SymbolIndexItem> {
    const isPackageMember = 'packageName' in query
    if (!isPackageMember) {
      return {
        key: `builtin.${query.value}`,
      }
    }

    const pkgPath = findPackagePathFromContext(query.context, query.packageName)
    if (pkgPath) {
      return {
        key: `${pkgPath}.${query.value}`,
      }
    }

    return {
      packageName: query.packageName,
      label: query.value,
    }
  }

  /**
   * Returns hover documentation for a symbol.
   */
  async getHoverValue(query: HoverQuery): Promise<monaco.languages.Hover | null> {
    await this.checkCacheReady()
    const filter = this.buildHoverFilter(query)
    const entry = await this.db.symbolIndex.where(filter).first()
    if (!entry) {
      return null
    }

    return {
      contents: symbolHoverDoc(entry),
      range: query.context.range,
    }
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

    if (isPackageQuery(query)) {
      return await this.getMemberSuggestion(query)
    }

    return await this.getLiteralSuggestion(query)
  }

  private async getMemberSuggestion({ value, packageName, context }: PackageSymbolQuery) {
    // If package with specified name is imported - filter symbols
    // to avoid overlap with packages with eponymous name.
    const packagePath = findPackagePathFromContext(context, packageName)

    const filter: Partial<SymbolIndexItem> = packagePath
      ? {
          packagePath,
        }
      : { packageName }

    if (value) {
      filter.prefix = value.charAt(0).toLowerCase()
    }

    const symbols = await this.db.symbolIndex.where(filter).toArray()
    return symbols.map((symbol) => completionFromSymbol(symbol, context, !!packagePath))
  }

  private async getLiteralSuggestion({ value, context }: LiteralQuery) {
    const packages = await this.db.packageIndex.where('prefix').equals(value).toArray()
    const builtins = await this.db.symbolIndex.where('packagePath').equals('builtin').toArray()

    const packageCompletions = packages.map((item) => completionFromPackage(item, context))
    const symbolsCompletions = builtins.map((item) => completionFromSymbol(item, context, false))

    return packageCompletions.concat(symbolsCompletions)
  }

  private async getStandardPackages() {
    await this.checkCacheReady()

    const results = await this.db.packageIndex.toArray()
    return results.map(importCompletionFromPackage)
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

    const count = await this.db.packageIndex.count()
    this.cachePopulated = count > 0
    if (!this.cachePopulated) {
      await this.populateCache()
    }
    return this.cachePopulated
  }

  private async populateCache() {
    if (!this.populatePromise) {
      // Cache population might be triggered by multiple actors outside.
      this.populatePromise = (async () => {
        const rsp = await fetch('/data/go-index.json')
        if (!rsp.ok) {
          throw new Error(`${rsp.status} ${rsp.statusText}`)
        }

        const data: GoIndexFile = await rsp.json()
        if (data.version > 1) {
          console.warn(`unsupported symbol index version: ${data.version}, skip update.`)
          return
        }

        const packages = constructPackages(data.packages)
        const symbols = constructSymbols(data.symbols)

        await Promise.all([
          this.db.packageIndex.clear(),
          this.db.symbolIndex.clear(),
          this.db.packageIndex.bulkAdd(packages),
          this.db.symbolIndex.bulkAdd(symbols),
          this.keyValue.setItem(completionVersionKey, data.go),
        ])

        this.cachePopulated = true
      })()
    }

    await this.populatePromise
  }
}
