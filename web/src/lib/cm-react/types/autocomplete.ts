import type { DocumentState } from './common'

export interface CursorPosition {
  lineNumber: number
  column: number
  offset: number
}

export interface CompletionTextEdit {
  from: number
  to: number
  insert: string
}

export interface CompletionItem {
  label: string
  detail?: string
  documentation?: string
  type?: string
  sortText?: string
  filterText?: string
  insertText: string
  isSnippet?: boolean
  replaceFrom: number
  replaceTo: number
  additionalTextEdits?: CompletionTextEdit[]
}

export interface CompletionResult {
  from: number
  to: number
  options: CompletionItem[]
}

// Ported from monaco.IMarkdownString
export interface IMarkdownString {
  readonly value: string
  readonly language?: string
}

type MarkedString = string | IMarkdownString
export type HoverContent = IMarkdownString | MarkedString | MarkedString[]

export interface HoverResult {
  from: number
  to: number
  contents: HoverContent
}

export interface CompletionRequest {
  document: DocumentState
  cursor: CursorPosition
  explicit: boolean
}

export interface HoverRequest {
  document: DocumentState
  cursor: CursorPosition
}

export interface DocumentEditChange {
  startLineNumber: number
  endLineNumber: number
}

export interface DocumentUpdate {
  path: string
  changes: DocumentEditChange[]
  isFlush?: boolean
}

export interface EditorAutocompleteSource {
  isWarmUp: () => Promise<boolean>
  complete: (req: CompletionRequest) => Promise<CompletionResult | null>
  hover: (req: HoverRequest) => Promise<HoverResult | null>
  handleDocumentUpdate: (update: DocumentUpdate) => void
  clear: (path?: string) => void
  dispose?: () => void
}
