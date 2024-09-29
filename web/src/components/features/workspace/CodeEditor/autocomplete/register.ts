import * as monaco from 'monaco-editor'

import { GoSymbolsCompletionItemProvider } from './symbols'
import { GoImportsCompletionProvider } from './imports'
import type { StateDispatch } from '~/store'
import { goCompletionService } from '~/services/completion'
import type { DocumentMetadataCache } from './cache'

/**
 * Registers all Go autocomplete providers for Monaco editor.
 */
export const registerGoLanguageProviders = (dispatcher: StateDispatch, cache: DocumentMetadataCache) => {
  return [
    monaco.languages.registerCompletionItemProvider(
      'go',
      new GoSymbolsCompletionItemProvider(dispatcher, goCompletionService, cache),
    ),
    monaco.languages.registerCompletionItemProvider(
      'go',
      new GoImportsCompletionProvider(dispatcher, goCompletionService),
    ),
  ]
}
