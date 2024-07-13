import * as monaco from 'monaco-editor'
import type { IAPIClient } from '~/services/api'

import { GoCompletionItemProvider } from './provider'

let alreadyRegistered = false
export const registerGoLanguageProvider = (client: IAPIClient) => {
  if (alreadyRegistered) {
    console.warn('Go Language provider was already registered')
    return
  }

  alreadyRegistered = true
  return monaco.languages.registerCompletionItemProvider('go', new GoCompletionItemProvider(client))
}
