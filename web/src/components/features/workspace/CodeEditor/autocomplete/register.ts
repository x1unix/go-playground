import * as monaco from 'monaco-editor'

import { GoSymbolsCompletionItemProvider } from './symbols'
import { GoImportsCompletionProvider } from './imports'
import { GoHoverProvider } from './hover'
import type { StateDispatch } from '~/store'
import type { DocumentMetadataCache } from './cache'
import type { LanguageWorker } from '~/workers/language'

const LANG_GO = 'go'

/**
 * Registers all Go autocomplete providers for Monaco editor.
 */
export const registerGoLanguageProviders = (
  dispatcher: StateDispatch,
  cache: DocumentMetadataCache,
  langWorker: LanguageWorker,
) => {
  return [
    monaco.languages.registerCompletionItemProvider(
      LANG_GO,
      new GoSymbolsCompletionItemProvider(dispatcher, cache, langWorker),
    ),
    monaco.languages.registerCompletionItemProvider(
      LANG_GO,
      new GoImportsCompletionProvider(dispatcher, cache, langWorker),
    ),
    monaco.languages.registerHoverProvider(LANG_GO, new GoHoverProvider(langWorker, cache)),
  ]
}
