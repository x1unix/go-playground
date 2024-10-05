import type * as monaco from 'monaco-editor'

export enum SymbolSourceKey {
  Name = 0,
  Path = 1,
}

type SymbolSource = [name: string, path: string]

/**
 * @see internal/pkgindex/index/types.go
 */
export interface Symbols {
  names: string[]
  docs: string[]
  details: string[]
  signatures: string[]
  insertTexts: string[]
  insertTextRules: monaco.languages.CompletionItemInsertTextRule[]
  kinds: monaco.languages.CompletionItemKind[]
  packages: SymbolSource[]
}

/**
 * @see internal/pkgindex/index/types.go
 */
export interface Packages {
  names: string[]
  paths: string[]
  docs: string[]
}

/**
 * Go index file response type.
 *
 * @see internal/pkgindex/index/types.go
 */
export interface GoIndexFile {
  /**
   * File format version.
   */
  version: number

  /**
   * Go version used to generate index.
   */
  go: string

  /**
   * List of standard packages.
   */
  packages: Packages

  /**
   * List of symbols of each package.
   */
  symbols: Symbols
}
