import type * as monaco from 'monaco-editor'

export enum ImportClauseType {
  /**
   * There is no any import block.
   */
  None,

  /**
   * Single line import.
   */
  Single,

  /**
   * Multi-line import block with braces.
   */
  Block,
}

export interface SuggestionContext {
  /**
   * Current edit range
   */
  range: monaco.IRange

  /**
   * Controls how auto import suggestions will be added.
   */
  imports: {
    /**
     * List of import paths from all import blocks.
     */
    allPaths?: Set<string>

    /**
     * Imports in a last block related to `range`.
     */
    blockPaths?: string[]

    /**
     * Type of nearest import block.
     */
    blockType: ImportClauseType

    /**
     * Position of nearest import block to insert new imports.
     *
     * If `blockType` is `ImportClauseType.None` - points to position
     * of nearest empty line after `package` clause.
     *
     * If there is no empty line after `package` clause - should point
     * to the end of clause statement + 1 extra column.
     *
     * Otherwise - should point to a full range of last `import` block.
     *
     * @see prependNewLine
     */
    range?: monaco.IRange

    /**
     * Indicates whether extra new line should be appended before `import` clause.
     *
     * Effective only when `range` is `ImportClauseType.None`.
     */
    prependNewLine?: boolean
  }
}

export interface SuggestionQuery {
  packageName?: string
  value: string
  context: SuggestionContext
}

export interface PackageInfo {
  name: string
  importPath: string
  documentation: string
}

export interface SymbolInfo {
  name: string
  documentation: string
  detail: string
  insertText: string
  kind: monaco.languages.CompletionItemKind
  package: {
    name: string
    path: string
  }
}

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
  packages: PackageInfo[]

  /**
   * List of symbols of each package.
   */
  symbols: SymbolInfo[]
}
