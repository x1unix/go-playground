import type * as monaco from 'monaco-editor'
import type { SuggestionContext, SuggestionQuery } from '~/workers/language'
import { asyncDebounce } from '../../utils/utils'
import snippets from './snippets'
import { parseExpression } from './parse'
import { CacheBasedCompletionProvider } from '../base'

const SUGGESTIONS_DEBOUNCE_DELAY = 500

/**
 * Provides completion for symbols such as variables and functions.
 */
export class GoSymbolsCompletionItemProvider extends CacheBasedCompletionProvider<SuggestionQuery> {
  triggerCharacters = Array.from('.abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ')
  private readonly getSuggestionFunc = asyncDebounce(
    async (query) => await this.langWorker.getSymbolSuggestions(query),
    SUGGESTIONS_DEBOUNCE_DELAY,
  )

  protected getFallbackSuggestions(query: SuggestionQuery): monaco.languages.CompletionList {
    if ('packageName' in query) {
      return { suggestions: [] }
    }

    // filter snippets by prefix.
    // usually monaco does that but not always in right way
    const { value } = query
    const items = value ? snippets.filter((s) => s.label.startsWith(value)) : snippets

    return {
      suggestions: items,
    }
  }

  protected parseCompletionQuery(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    _context: monaco.languages.CompletionContext,
    _token: monaco.CancellationToken,
  ) {
    const val = model
      .getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 0,
        endLineNumber: position.lineNumber,
        endColumn: position.column,
      })
      .trim()

    const query = parseExpression(val)
    console.log('expr', query)
    if (!query) {
      return null
    }

    const word = model.getWordUntilPosition(position)
    const range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn,
    }

    const imports = this.metadataCache.getMetadata(model)
    const context: SuggestionContext = {
      range,
      imports,
    }

    return { ...query, context }
  }

  protected async querySuggestions(query: SuggestionQuery) {
    const { suggestions: relatedSnippets } = this.getFallbackSuggestions(query)
    const results = await this.getSuggestionFunc(query)
    if (!results?.length) {
      return relatedSnippets
    }

    return relatedSnippets.length ? relatedSnippets.concat(results) : results
  }
}
