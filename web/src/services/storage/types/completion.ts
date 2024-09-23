import type * as monaco from 'monaco-editor'

export type CompletionItem = monaco.languages.CompletionItem
export type CompletionItems = monaco.languages.CompletionItem[]

export enum CompletionRecordType {
  None,
  ImportPath,
  Symbol,
}

/**
 * Type represents CompletionRecord keys that can be used for query using DB index.
 */
export type IndexableKey = keyof Omit<CompletionRecord, keyof CompletionItem>

/**
 * Entity represends completion record stored in a cache.
 *
 * Extends monaco type with some extra indexing information.
 */
export interface CompletionRecord extends monaco.languages.CompletionItem {
  /**
   * Completion category
   */
  recordType: CompletionRecordType

  /**
   * Symbol name's first letter.
   * Used as monaco triggers completion provider only after first character appear.
   */
  prefix: string

  /**
   * Package name to what this symbol belongs.
   */
  packageName: string
}
