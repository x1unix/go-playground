import * as monaco from 'monaco-editor'
import type { IAPIClient } from '~/services/api'

import { GoCompletionItemProvider } from './symbols'
import { GoImportsCompletionProvider } from './imports'
import type { StateDispatch } from '~/store'

let alreadyRegistered = false

/**
 * Registers all Go autocomplete providers for Monaco editor.
 */
export const registerGoLanguageProviders = (client: IAPIClient, dispatcher: StateDispatch) => {
  if (alreadyRegistered) {
    console.warn('Go Language provider was already registered')
    return
  }

  alreadyRegistered = true
  return [
    monaco.languages.registerCompletionItemProvider('go', new GoCompletionItemProvider(client)),
    monaco.languages.registerCompletionItemProvider('go', new GoImportsCompletionProvider(dispatcher)),
  ]
}
