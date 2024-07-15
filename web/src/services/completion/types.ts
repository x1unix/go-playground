import type * as monaco from 'monaco-editor'

export type CompletionItems = monaco.languages.CompletionItem[]

/**
 * Go standard packages list dumped by `pkgindexer` tool.
 */
export interface GoImportsList {
  version: string

  packages: CompletionItems
}
