import * as monaco from 'monaco-editor'

import { GoSymbolsCompletionItemProvider } from './symbols'
import { GoImportsCompletionProvider } from './imports'
import { GoHoverProvider } from './hover'
import { LanguageID } from '../grammar'
import type { StateDispatch } from '~/store'
import type { DocumentMetadataCache } from './cache'
import type { LanguageWorker } from '~/workers/language'

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
      LanguageID.Go,
      new GoSymbolsCompletionItemProvider(dispatcher, cache, langWorker),
    ),
    monaco.languages.registerCompletionItemProvider(
      LanguageID.Go,
      new GoImportsCompletionProvider(dispatcher, cache, langWorker),
    ),
    monaco.languages.registerHoverProvider(LanguageID.Go, new GoHoverProvider(langWorker, cache)),
  ]
}
