import type * as monaco from 'monaco-editor'

export type CompletionItems = monaco.languages.CompletionItem[]

export interface CompletionRecord extends monaco.languages.CompletionItem {
  packageName?: string
}
