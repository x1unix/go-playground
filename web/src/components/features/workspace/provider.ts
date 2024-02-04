import { loader } from '@monaco-editor/react'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import * as monaco from 'monaco-editor'
import { type IAPIClient } from '~/services/api'
import snippets from './snippets'
import { wrapAsyncWithDebounce } from './utils'

// Import aliases
type CompletionList = monaco.languages.CompletionList
type CompletionContext = monaco.languages.CompletionContext
type ITextModel = monaco.editor.ITextModel
type Position = monaco.Position
type CancellationToken = monaco.CancellationToken

let alreadyRegistered = false

// Matches package (and method name)
const COMPL_REGEXP = /([a-zA-Z0-9_]+)(\.([A-Za-z0-9_]+))?$/
const R_GROUP_PKG = 1
const R_GROUP_METHOD = 3
const SUGGESTIONS_DEBOUNCE_DELAY = 500

const parseExpression = (expr: string) => {
  COMPL_REGEXP.lastIndex = 0 // Reset regex state
  const m = COMPL_REGEXP.exec(expr)
  if (!m) {
    return null
  }

  const varName = m[R_GROUP_PKG]
  const propValue = m[R_GROUP_METHOD]

  if (!propValue) {
    return { value: varName }
  }

  return {
    packageName: varName,
    value: propValue,
  }
}

self.MonacoEnvironment = {
  getWorker: () => {
    return new EditorWorker()
  },
}

class GoCompletionItemProvider implements monaco.languages.CompletionItemProvider {
  private readonly getSuggestionFunc: IAPIClient['getSuggestions']

  constructor(private readonly client: IAPIClient) {
    this.getSuggestionFunc = wrapAsyncWithDebounce(
      async (query) => await client.getSuggestions(query),
      SUGGESTIONS_DEBOUNCE_DELAY,
    )
  }

  async provideCompletionItems(
    model: ITextModel,
    position: Position,
    context: CompletionContext,
    token: CancellationToken,
  ): Promise<CompletionList> {
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

export const registerGoLanguageProvider = (client: IAPIClient) => {
  if (alreadyRegistered) {
    console.warn('Go Language provider was already registered')
    return
  }

  alreadyRegistered = true
  loader.config({ monaco })
  return monaco.languages.registerCompletionItemProvider('go', new GoCompletionItemProvider(client))
}
