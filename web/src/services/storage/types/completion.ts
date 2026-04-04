import type { CompletionItem as LSPCompletionItem, MarkupContent } from 'vscode-languageserver-protocol'

export type CompletionItem = LSPCompletionItem
export type CompletionItems = LSPCompletionItem[]

/**
 * Normalized version of CompletionItem with stable markdown docs shape.
 */
export interface NormalizedCompletionItem extends Omit<LSPCompletionItem, 'documentation'> {
  label: string
  documentation?: MarkupContent
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
   * Prefix for search by first letter.
   */
  prefix: string

  /**
   * Package docs in markdown format.
   */
  documentation?: MarkupContent
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
   * Prefix for search by first letter.
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
