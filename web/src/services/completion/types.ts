import type * as monaco from 'monaco-editor'

export type CompletionItems = monaco.languages.CompletionItem[]

export interface SuggestionQuery {
  packageName?: string
  value: string
}

/**
 * Go standard packages list dumped by `pkgindexer` tool.
 */
export interface GoImportsFile {
  /**
   * File format version
   */
  format?: string

  /**
   * Go version used to generate list.
   *
   * Key kept for historical reasons.
   */
  version: string

  /**
   * List of go packages
   */
  packages: CompletionItems

  /**
   * Key-value pair of package name and its symbols.
   */
  symbols: Record<string, CompletionItems>
}
