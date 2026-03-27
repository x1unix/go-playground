import type { CompletionItem as LSPCompletionItem, Range, TextEdit } from 'vscode-languageserver-protocol'

import { Syntax, type DocumentState } from '../types/common'
import type { LanguageWorkerRef } from '~/workers/language'
import {
  ImportClauseType,
  type HoverQuery,
  type ImportsContext,
  type SuggestionContext,
  type SuggestionQuery,
} from '~/workers/language/types'

import { completionFromLSPItem, hoverFromLSP } from './converter'
import { DocumentMetadataCache } from './cache'
import { queryFromPosition } from './hover'
import { isWithinImportClause } from './imports'
import snippets from './snippets'
import { parseExpression, type PackageQuery } from './symbols'
import type {
  CompletionRequest,
  CompletionResult,
  CursorPosition,
  DocumentUpdate,
  EditorAutocompleteSource,
  HoverRequest,
  HoverResult,
} from '../types/autocomplete'
import { isInsideNonCodeContext, wordRangeAtOffset } from './utils'

const SUGGESTIONS_DEBOUNCE_DELAY = 500

const asyncDebounce = <TArgs extends unknown[], TResult>(fn: (...args: TArgs) => Promise<TResult>, delay: number) => {
  let lastTimeoutId: ReturnType<typeof setTimeout> | null = null

  return async (...args: TArgs) => {
    if (lastTimeoutId) {
      clearTimeout(lastTimeoutId)
    }

    return await new Promise<TResult>((resolve, reject) => {
      lastTimeoutId = setTimeout(() => {
        fn(...args)
          .then(resolve)
          .catch(reject)
      }, delay)
    })
  }
}

const isPackageQuery = (query: ReturnType<typeof parseExpression>): query is PackageQuery => {
  return !!query && 'packageName' in query
}

const rangeFromOffsets = (doc: DocumentState['text'], from: number, to: number): Range => {
  const startLine = doc.lineAt(from)
  const endLine = doc.lineAt(to)

  return {
    start: {
      // CodeMirror lines are 1-based, but LSP `Position.line` is 0-based.
      line: startLine.number - 1,
      // Offset inside the line is already 0-based, which matches LSP `Position.character`.
      character: from - startLine.from,
    },
    end: {
      // CodeMirror lines are 1-based, but LSP `Position.line` is 0-based.
      line: endLine.number - 1,
      // Offset inside the line is already 0-based, which matches LSP `Position.character`.
      character: to - endLine.from,
    },
  }
}

const normalizeError = (err: unknown) => {
  if (err instanceof Error) {
    return err
  }

  return new Error(String(err))
}

const importPackageTextEdit = (importPath: string, imports: ImportsContext): TextEdit[] | undefined => {
  if (!imports.range || imports.allPaths?.has(importPath)) {
    return undefined
  }

  switch (imports.blockType) {
    case ImportClauseType.None: {
      const text = `import "${importPath}"\n`
      return [
        {
          newText: imports.prependNewLine ? `\n${text}` : text,
          range: imports.range,
        },
      ]
    }
    case ImportClauseType.Single:
    case ImportClauseType.Block: {
      const importLines = (imports.blockPaths ?? [])
        .concat(importPath)
        .sort()
        .map((value) => `\t"${value}"`)
        .join('\n')

      return [
        {
          newText: `import (\n${importLines}\n)`,
          range: imports.range,
        },
      ]
    }
  }
}

const packagePathFromData = (item: LSPCompletionItem) => {
  if (!item.data || typeof item.data !== 'object') {
    return undefined
  }

  const packagePath = (item.data as Record<string, unknown>).packagePath
  if (typeof packagePath !== 'string' || packagePath.length === 0) {
    return undefined
  }

  return packagePath
}

export class GoAutocompleteSource implements EditorAutocompleteSource {
  private readonly metadataCache = new DocumentMetadataCache()
  private readonly getSuggestions = asyncDebounce(async (query: SuggestionQuery) => {
    return await this.langWorkerRef.acquire(async (worker) => await worker.getSymbolSuggestions(query))
  }, SUGGESTIONS_DEBOUNCE_DELAY)
  private isCacheReady = false
  private builtins?: Set<string>

  constructor(private readonly langWorkerRef: LanguageWorkerRef) {}

  supportsSyntax(syntax: Syntax) {
    return syntax === Syntax.Go
  }

  async isWarmUp() {
    if (this.isCacheReady) {
      return true
    }

    this.isCacheReady = await this.langWorkerRef.acquire(async (worker) => await worker.isWarmUp())
    return this.isCacheReady
  }

  handleDocumentUpdate(update: DocumentUpdate) {
    this.metadataCache.handleUpdate(update)
  }

  clear(path?: string) {
    this.metadataCache.flush(path)
  }

  dispose() {
    this.metadataCache.flush()
    this.langWorkerRef.dispose()
  }

  async complete(req: CompletionRequest): Promise<CompletionResult | null> {
    if (req.document.language !== Syntax.Go) {
      return null
    }

    const importResult = await this.completeImports(req)
    const symbolResult = await this.completeSymbols(req)
    if (!importResult && !symbolResult) {
      return null
    }

    if (importResult && symbolResult) {
      return {
        from: Math.min(importResult.from, symbolResult.from),
        to: Math.max(importResult.to, symbolResult.to),
        options: [...symbolResult.options, ...importResult.options],
      }
    }

    return importResult ?? symbolResult
  }

  async hover(req: HoverRequest): Promise<HoverResult | null> {
    if (req.document.language !== Syntax.Go) {
      return null
    }

    const query = queryFromPosition(req.document, req.cursor.offset)
    if (!query) {
      return null
    }

    const isLiteral = !('packageName' in query)
    if (isLiteral) {
      if (!this.builtins) {
        const builtins = await this.langWorkerRef.acquire(async (worker) => await worker.getBuiltinNames())
        this.builtins = new Set(builtins)
      }

      if (!this.builtins.has(query.value)) {
        return null
      }
    }

    const imports = this.metadataCache.getMetadata(req.document)
    const hoverRange = rangeFromOffsets(req.document.text, query.from, query.to)
    const packageName = query.packageName
      ? this.metadataCache.resolveImportAlias(req.document, query.packageName)
      : undefined
    const workerQuery: HoverQuery = {
      ...query,
      ...(packageName ? { packageName } : {}),
      context: {
        imports,
        range: hoverRange,
      },
    }

    const hoverValue = await this.langWorkerRef.acquire(async (worker) => await worker.getHoverValue(workerQuery))
    if (!hoverValue) {
      return null
    }

    return hoverFromLSP(hoverValue, req.document.text)
  }

  private async completeImports(req: CompletionRequest): Promise<CompletionResult | null> {
    if (!this.isImportStatementRange(req.document, req.cursor)) {
      return null
    }

    const wordRange = wordRangeAtOffset(req.document.text, req.cursor.offset)
    const fallbackRange = {
      from: wordRange.from,
      to: wordRange.to,
    }

    try {
      const suggestions = await this.langWorkerRef.acquire(async (worker) => await worker.getImportSuggestions())
      this.isCacheReady = true
      return {
        from: fallbackRange.from,
        to: fallbackRange.to,
        options: suggestions.map((item) => completionFromLSPItem(req.document.text, item, fallbackRange)),
      }
    } catch (err) {
      throw normalizeError(err)
    }
  }

  private async completeSymbols(req: CompletionRequest): Promise<CompletionResult | null> {
    if (!req.tree) {
      console.warn('GoAutocompleteSource.completeSymbols: syntax tree not available, skipping symbol completions')
      return null
    }

    if (isInsideNonCodeContext(req.tree, req.cursor.offset)) {
      return null
    }

    const line = req.document.text.line(req.cursor.lineNumber)
    const localOffset = req.cursor.offset - line.from
    const expression = line.text.slice(0, localOffset).trim()
    const query = parseExpression(expression)
    if (!query) {
      return null
    }

    const wordRange = wordRangeAtOffset(req.document.text, req.cursor.offset)
    const fallbackRange = {
      from: wordRange.from,
      to: wordRange.to,
    }

    const imports = this.metadataCache.getMetadata(req.document)
    const packageName = isPackageQuery(query)
      ? this.metadataCache.resolveImportAlias(req.document, query.packageName)
      : undefined
    const context: SuggestionContext = {
      range: {
        start: {
          line: req.cursor.lineNumber - 1,
          character: wordRange.startColumn - 1,
        },
        end: {
          line: req.cursor.lineNumber - 1,
          character: wordRange.endColumn - 1,
        },
      },
      imports,
    }

    const typedLiteral = 'value' in query ? (query.value ?? '') : ''
    const suggestionQuery: SuggestionQuery = isPackageQuery(query)
      ? {
          packageName: packageName ?? query.packageName,
          value: typedLiteral || undefined,
          context,
        }
      : {
          value: typedLiteral.charAt(0),
          context,
        }

    const fallbackSuggestions = this.getFallbackSuggestions(query)

    let results: LSPCompletionItem[]
    try {
      const workerResult = await this.getSuggestions(suggestionQuery)
      this.isCacheReady = true
      results = workerResult?.length ? workerResult : []
    } catch (err) {
      throw normalizeError(err)
    }

    const suggestions = fallbackSuggestions.length ? fallbackSuggestions.concat(results) : results
    const completionItems = suggestions.map((item) => {
      const enriched = this.addMissingImportTextEdits(item, suggestionQuery, imports)
      return completionFromLSPItem(req.document.text, enriched, fallbackRange)
    })

    const filteredOptions = isPackageQuery(query)
      ? completionItems
      : completionItems.filter((item) => {
          if (!query.value) {
            return true
          }

          const label = item.filterText ?? item.label
          return label.toLowerCase().startsWith(query.value.toLowerCase())
        })

    if (!filteredOptions.length) {
      return null
    }

    return {
      from: fallbackRange.from,
      to: fallbackRange.to,
      options: filteredOptions,
    }
  }

  private getFallbackSuggestions(query: ReturnType<typeof parseExpression>): LSPCompletionItem[] {
    if (!query) {
      return []
    }

    if ('packageName' in query) {
      return []
    }

    const value = query.value
    return value ? snippets.filter((snippet) => String(snippet.label).startsWith(value)) : snippets
  }

  private isImportStatementRange(doc: DocumentState, pos: CursorPosition) {
    const meta = this.metadataCache.getMetadata(doc)
    if (meta.totalRange) {
      const minLine = meta.totalRange.start.line + 1
      const maxLine = meta.totalRange.end.line + 1
      return pos.lineNumber >= minLine && pos.lineNumber <= maxLine
    }

    return isWithinImportClause(doc, pos.lineNumber)
  }

  private addMissingImportTextEdits(
    item: LSPCompletionItem,
    query: SuggestionQuery,
    imports: ImportsContext,
  ): LSPCompletionItem {
    if (!('packageName' in query)) {
      return item
    }

    if (item.additionalTextEdits?.length) {
      return item
    }

    const packagePath = packagePathFromData(item)
    if (!packagePath) {
      return item
    }

    const edits = importPackageTextEdit(packagePath, imports)
    if (!edits?.length) {
      return item
    }

    return {
      ...item,
      additionalTextEdits: edits,
    }
  }
}

export const newGoAutocompleteSource = (langWorkerRef: LanguageWorkerRef) => new GoAutocompleteSource(langWorkerRef)
