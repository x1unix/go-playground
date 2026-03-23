import type {
  CompletionItem as LSPCompletionItem,
  Hover as LSPHover,
  Range,
  TextEdit,
} from 'vscode-languageserver-protocol'
import type { DocumentState, Syntax } from './common'

export type CompletionDoc = NonNullable<LSPCompletionItem['documentation']>
export type HoverContent = LSPHover['contents']
export type DocContent = CompletionDoc | HoverContent

export interface CursorPosition {
  lineNumber: number
  column: number
  offset: number
}

export interface CompletionItem extends Omit<LSPCompletionItem, 'additionalTextEdits'> {
  insertText: string
  replaceFrom: number
  replaceTo: number
  additionalTextEdits?: TextEdit[]
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

export interface DocumentUpdate {
  path: string
  changes: Range[]
  isFlush?: boolean
}

export interface EditorAutocompleteSource {
  supportsSyntax: (syntax: Syntax) => boolean
  isWarmUp: () => Promise<boolean>
  complete: (req: CompletionRequest) => Promise<CompletionResult | null>
  hover: (req: HoverRequest) => Promise<HoverResult | null>
  handleDocumentUpdate: (update: DocumentUpdate) => void
  clear: (path?: string) => void
  dispose?: () => void
}
