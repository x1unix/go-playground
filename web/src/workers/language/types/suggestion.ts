import type { Range } from 'vscode-languageserver-protocol'

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

export interface ImportsContext {
  /**
   * Whether any error was detected during context build.
   */
  hasError?: boolean

  /**
   * List of import paths from all import blocks.
   */
  allPaths?: Set<string>

  /**
   * Map of named import aliases to destination import paths.
   */
  importAliases?: Map<string, string>

  /**
   * Start and end line of area containing all imports.
   *
   * This area will be monitored for changes to update document imports cache.
   */
  totalRange?: Range

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
  range?: Range

  /**
   * Indicates whether extra new line should be appended before `import` clause.
   *
   * Effective only when `range` is `ImportClauseType.None`.
   */
  prependNewLine?: boolean
}

export interface SuggestionContext {
  /**
   * Current edit range
   */
  range: Range

  /**
   * Controls how auto import suggestions will be added.
   */
  imports: ImportsContext
}

export interface LiteralQuery {
  value: string
  context: SuggestionContext
}

export interface PackageSymbolQuery {
  packageName: string
  value?: string
  context: SuggestionContext
}

export type SuggestionQuery = LiteralQuery | PackageSymbolQuery

export type HoverQuery = LiteralQuery | Required<PackageSymbolQuery>
