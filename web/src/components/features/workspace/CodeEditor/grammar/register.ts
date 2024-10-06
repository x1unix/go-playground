import * as monaco from 'monaco-editor'

import { LanguageID } from './ids'

const isLangRegistered = (langId: string) => {
  // Monaco doesn't provide quick search
  const match = monaco.languages.getLanguages().filter(({ id }) => id === langId)
  return !!match.length
}

const concatDisposables = (...items: monaco.IDisposable[]): monaco.IDisposable => ({
  dispose: () => {
    items.forEach((i) => i.dispose())
  },
})

export const registerExtraLanguages = (): monaco.IDisposable => {
  if (!isLangRegistered(LanguageID.GoMod)) {
    monaco.languages.register({
      id: 'go.mod',
      extensions: ['.mod'],
      filenames: ['go.mod'],
      aliases: ['GoMod'],
    })
  }

  return concatDisposables(
    monaco.languages.registerTokensProviderFactory(LanguageID.GoMod, {
      create: async () => {
        const mod = await import('./gomod.ts')
        return mod.language
      },
    }),

    monaco.languages.onLanguageEncountered(LanguageID.GoMod, async () => {
      const mod = await import('./gomod.ts')
      monaco.languages.setLanguageConfiguration(LanguageID.GoMod, mod.conf)
    }),
  )
}
