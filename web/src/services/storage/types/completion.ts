import type * as monaco from 'monaco-editor'

export type CompletionItem = monaco.languages.CompletionItem
export type CompletionItems = monaco.languages.CompletionItem[]

/**
 * Normalized version of CompletionItem that contains fixed types instead of union (e.g. Foo | Bar)
 */
export interface NormalizedCompletionItem extends Omit<monaco.languages.CompletionItem, 'label' | 'range'> {
  label: string
  documentation?: monaco.IMarkdownString
}

/**
 * Represents record from package index.
 */
export interface PackageIndexItem {
  /**
   * Full import path.
   */
  importPath: string

  /**
   * Package name.
   */
  name: string

  /**
   * Prefix for search by first letter supplied by Monaco.
   */
  prefix: string

  /**
   * Inherited from CompletionItem.
   */
  documentation?: monaco.IMarkdownString
}

/**
 * Represents record from symbol index.
 */
export interface SymbolIndexItem extends NormalizedCompletionItem {
  /**
   * Key is compound pair of package name and symbol name.
   *
   * E.g. `syscall/js.Value`
   */
  key: string

  /**
   * Prefix for search by first letter supplied by Monaco.
   */
  prefix: string

  /**
   * Full package path to which this symbol belongs.
   */
  packagePath: string

  /**
   * Package name part of package path
   */
  packageName: string

  /**
   * Signature represents full symbol signature to show on hover.
   */
  signature: string
}
