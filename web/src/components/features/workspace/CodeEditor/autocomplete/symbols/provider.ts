import type * as monaco from 'monaco-editor'
import { type IAPIClient } from '~/services/api'
import { wrapAsyncWithDebounce } from '../../utils'
import snippets from './snippets'
import { parseExpression } from './parse'

const SUGGESTIONS_DEBOUNCE_DELAY = 500

export class GoCompletionItemProvider implements monaco.languages.CompletionItemProvider {
  private readonly getSuggestionFunc: IAPIClient['getSuggestions']

  constructor(private readonly client: IAPIClient) {
    this.getSuggestionFunc = wrapAsyncWithDebounce(
      async (query) => await client.getSuggestions(query),
      SUGGESTIONS_DEBOUNCE_DELAY,
    )
  }

  async provideCompletionItems(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext,
    token: monaco.CancellationToken,
  ): Promise<monaco.languages.CompletionList> {
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
      return await Promise.resolve({ suggestions: [] })
    }

    const word = model.getWordUntilPosition(position)
    const range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn,
    }

    // filter snippets by prefix.
    // usually monaco does that but not always in right way
    const relatedSnippets = snippets
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      .filter((s) => s.label.toString().startsWith(query.value))
      .map((s) => ({ ...s, range }))

    try {
      const { suggestions } = await this.getSuggestionFunc(query)
      if (!suggestions) {
        return {
          suggestions: relatedSnippets,
        }
      }

      return {
        suggestions: relatedSnippets.concat(suggestions.map((s) => ({ ...s, range }))),
      }
    } catch (err: any) {
      console.error(`Failed to get code completion from server: ${err.message}`)
      return { suggestions: relatedSnippets }
    }
  }
}
