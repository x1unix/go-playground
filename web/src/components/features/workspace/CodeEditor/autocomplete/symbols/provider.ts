import type * as monaco from 'monaco-editor'
import type { SuggestionContext, SuggestionQuery } from '~/services/completion'
import { asyncDebounce } from '../../utils'
import snippets from './snippets'
import { parseExpression } from './parse'
import { CacheBasedCompletionProvider } from '../base'
import { buildImportContext } from './imports'

const SUGGESTIONS_DEBOUNCE_DELAY = 500

/**
 * Provides completion for symbols such as variables and functions.
 */
export class GoSymbolsCompletionItemProvider extends CacheBasedCompletionProvider<SuggestionQuery> {
  private readonly getSuggestionFunc = asyncDebounce(
    async (query) => await this.cache.getSymbolSuggestions(query),
    SUGGESTIONS_DEBOUNCE_DELAY,
  )

  protected getFallbackSuggestions({ value, context: { range } }: SuggestionQuery) {
    // filter snippets by prefix.
    // usually monaco does that but not always in right way
    const suggestions = snippets
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      .filter((s) => s.label.toString().startsWith(value))
      .map((s) => ({ ...s, range }))

    return { suggestions }
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

    const context: SuggestionContext = {
      range,
      imports: buildImportContext(model),
    }

    return { ...query, context }
  }

  protected async querySuggestions(query: SuggestionQuery) {
    const { suggestions: relatedSnippets } = this.getFallbackSuggestions(query)
    const suggestions = await this.getSuggestionFunc(query)
    if (!suggestions?.length) {
      return relatedSnippets
    }

    const {
      context: { range },
    } = query
    return relatedSnippets.concat(suggestions.map((s) => ({ ...s, range })))
  }
}
