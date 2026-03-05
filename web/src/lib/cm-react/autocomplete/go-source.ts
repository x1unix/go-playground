import type * as monaco from 'monaco-editor'

import { Syntax, type DocumentState } from '../types/common'
import type { LanguageWorker } from '~/workers/language'
import type { HoverQuery, SuggestionContext, SuggestionQuery } from '~/workers/language/types'

import { completionFromMonacoItem, hoverFromMonaco } from './converter'
import { DocumentMetadataCache } from './cache'
import { queryFromPosition } from './hover'
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
} from './types'
import { wordRangeAtOffset } from './utils'

const inlineImportRegex = /^import\s+([\w_|.]+\s)?"((\S+)?")?$/
const importPackageRegex = /^\s+?([\w_|.]+\s)?"\S+"$/
const importGroupRegex = /^import\s?\(\s?$/
const emptyLineOrCommentRegex = /^\s+$|^\s?\/\//
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

const rangeFromOffsets = (doc: DocumentState['text'], from: number, to: number): monaco.IRange => {
  const startLine = doc.lineAt(from)
  const endLine = doc.lineAt(to)

  return {
    startLineNumber: startLine.number,
    endLineNumber: endLine.number,
    startColumn: from - startLine.from + 1,
    endColumn: to - endLine.from + 1,
  }
}

const normalizeError = (err: unknown) => {
  if (err instanceof Error) {
    return err
  }

  return new Error(String(err))
}

export class GoAutocompleteSource implements EditorAutocompleteSource {
  private readonly metadataCache = new DocumentMetadataCache()
  private readonly getSuggestions = asyncDebounce(
    async (query: SuggestionQuery) => await this.langWorker.getSymbolSuggestions(query),
    SUGGESTIONS_DEBOUNCE_DELAY,
  )
  private isCacheReady = false
  private builtins?: Set<string>

  constructor(private readonly langWorker: LanguageWorker) {}

  async isWarmUp() {
    if (this.isCacheReady) {
      return true
    }

    this.isCacheReady = await this.langWorker.isWarmUp()
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
        this.builtins = new Set(await this.langWorker.getBuiltinNames())
      }

      if (!this.builtins.has(query.value)) {
        return null
      }
    }

    const imports = this.metadataCache.getMetadata(req.document)
    const hoverRange = rangeFromOffsets(req.document.text, query.from, query.to)
    const workerQuery: HoverQuery = {
      ...query,
      context: {
        imports,
        range: hoverRange,
      },
    }

    const hoverValue = await this.langWorker.getHoverValue(workerQuery)
    if (!hoverValue) {
      return null
    }

    return hoverFromMonaco(hoverValue, req.document.text)
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
      const suggestions = await this.langWorker.getImportSuggestions()
      this.isCacheReady = true
      return {
        from: fallbackRange.from,
        to: fallbackRange.to,
        options: suggestions.map((item) => completionFromMonacoItem(req.document.text, item, fallbackRange)),
      }
    } catch (err) {
      throw normalizeError(err)
    }
  }

  private async completeSymbols(req: CompletionRequest): Promise<CompletionResult | null> {
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
    const context: SuggestionContext = {
      range: {
        startLineNumber: req.cursor.lineNumber,
        endLineNumber: req.cursor.lineNumber,
        startColumn: wordRange.startColumn,
        endColumn: wordRange.endColumn,
      },
      imports,
    }

    const suggestionQuery: SuggestionQuery = isPackageQuery(query)
      ? {
          packageName: query.packageName,
          value: query.value,
          context,
        }
      : {
          value: query.value,
          context,
        }

    const fallbackSuggestions = this.getFallbackSuggestions(suggestionQuery)

    let results: monaco.languages.CompletionItem[]
    try {
      const workerResult = await this.getSuggestions(suggestionQuery)
      this.isCacheReady = true
      results = workerResult?.length ? workerResult : []
    } catch (err) {
      throw normalizeError(err)
    }

    const suggestions = fallbackSuggestions.length ? fallbackSuggestions.concat(results) : results
    if (!suggestions.length) {
      return null
    }

    return {
      from: fallbackRange.from,
      to: fallbackRange.to,
      options: suggestions.map((item) => completionFromMonacoItem(req.document.text, item, fallbackRange)),
    }
  }

  private getFallbackSuggestions(query: SuggestionQuery): monaco.languages.CompletionItem[] {
    if ('packageName' in query) {
      return []
    }

    const value = query.value
    return value ? snippets.filter((snippet) => String(snippet.label).startsWith(value)) : snippets
  }

  private isImportStatementRange(doc: DocumentState, pos: CursorPosition) {
    const meta = this.metadataCache.getMetadata(doc)
    if (!meta.hasError && meta.totalRange) {
      const { startLineNumber: minLine, endLineNumber: maxLine } = meta.totalRange
      return pos.lineNumber >= minLine && pos.lineNumber <= maxLine
    }

    const line = doc.text.line(pos.lineNumber).text
    if (inlineImportRegex.test(line)) {
      return true
    }

    for (let i = pos.lineNumber - 1; i > 0; i--) {
      const row = doc.text.line(i).text

      if (importPackageRegex.test(row) || importGroupRegex.test(row)) {
        return true
      }

      if (emptyLineOrCommentRegex.test(row)) {
        continue
      }

      return false
    }

    return false
  }
}

export const newGoAutocompleteSource = (langWorker: LanguageWorker) => new GoAutocompleteSource(langWorker)
