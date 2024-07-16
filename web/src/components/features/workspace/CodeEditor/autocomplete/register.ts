import * as monaco from 'monaco-editor'
import type { IAPIClient } from '~/services/api'

import { GoCompletionItemProvider } from './symbols'
import { GoImportsCompletionProvider } from './imports'
import type { StateDispatch } from '~/store'

/**
 * Registers all Go autocomplete providers for Monaco editor.
 */
export const registerGoLanguageProviders = (client: IAPIClient, dispatcher: StateDispatch) => {
  return [
    monaco.languages.registerCompletionItemProvider('go', new GoCompletionItemProvider(client)),
    monaco.languages.registerCompletionItemProvider('go', new GoImportsCompletionProvider(dispatcher)),
  ]
}
