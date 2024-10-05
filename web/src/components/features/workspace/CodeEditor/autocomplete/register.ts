import * as monaco from 'monaco-editor'

import { GoSymbolsCompletionItemProvider } from './symbols'
import { GoImportsCompletionProvider } from './imports'
import { GoHoverProvider } from './hover'
import type { StateDispatch } from '~/store'
import type { DocumentMetadataCache } from './cache'
import { getLanguageWorker } from '~/workers/language'

/**
 * Registers all Go autocomplete providers for Monaco editor.
 */
export const registerGoLanguageProviders = (dispatcher: StateDispatch, cache: DocumentMetadataCache) => {
  const worker = getLanguageWorker()
  return [
    monaco.languages.registerCompletionItemProvider(
      'go',
      new GoSymbolsCompletionItemProvider(dispatcher, cache, worker),
    ),
    monaco.languages.registerCompletionItemProvider('go', new GoImportsCompletionProvider(dispatcher, cache, worker)),
    monaco.languages.registerHoverProvider('go', new GoHoverProvider(worker, cache)),
  ]
}
