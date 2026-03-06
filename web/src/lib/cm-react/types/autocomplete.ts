import type { DocumentState } from './common'

// Ported from monaco.IMarkdownString
export interface IMarkdownString {
  readonly value: string
  readonly language?: string
}

export type MarkedString = string | IMarkdownString
export type DocContent = IMarkdownString | MarkedString | MarkedString[]

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

export type CompletionItemKind =
  | 'method'
  | 'function'
  | 'constructor'
  | 'field'
  | 'variable'
  | 'class'
  | 'struct'
  | 'interface'
  | 'module'
  | 'property'
  | 'event'
  | 'operator'
  | 'unit'
  | 'value'
  | 'constant'
  | 'enum'
  | 'enumMember'
  | 'keyword'
  | 'text'
  | 'color'
  | 'file'
  | 'reference'
  | 'folder'
  | 'typeParameter'
  | 'snippet'

export interface CompletionItem {
  label: string
  detail?: string
  documentation?: DocContent
  type?: CompletionItemKind
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

export interface HoverResult {
  from: number
  to: number
  contents: DocContent
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
