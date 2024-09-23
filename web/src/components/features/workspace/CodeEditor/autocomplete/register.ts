import * as monaco from 'monaco-editor'

import { GoSymbolsCompletionItemProvider } from './symbols'
import { GoImportsCompletionProvider } from './imports'
import type { StateDispatch } from '~/store'
import { goCompletionService } from '~/services/completion'

/**
 * Registers all Go autocomplete providers for Monaco editor.
 */
export const registerGoLanguageProviders = (dispatcher: StateDispatch) => {
  return [
    monaco.languages.registerCompletionItemProvider(
      'go',
      new GoSymbolsCompletionItemProvider(dispatcher, goCompletionService),
    ),
    monaco.languages.registerCompletionItemProvider(
      'go',
      new GoImportsCompletionProvider(dispatcher, goCompletionService),
    ),
  ]
}
