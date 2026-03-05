import type { Text } from '@codemirror/state'

import type { DocumentState } from '../types/common'

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

export interface HoverResult {
  from: number
  to: number
  contents: string[]
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

export interface ImportedRange {
  startLineNumber: number
  endLineNumber: number
  startColumn: number
  endColumn: number
}

export interface ImportsContext {
  hasError?: boolean
  allPaths?: Set<string>
  totalRange?: Pick<ImportedRange, 'startLineNumber' | 'endLineNumber'>
  blockPaths?: string[]
  blockType: number
  range?: ImportedRange
  prependNewLine?: boolean
}

export interface TextLine {
  number: number
  from: number
  to: number
  text: string
  length: number
}

export interface TextReader {
  doc: Text
  toString: () => string
  lineAt: (pos: number) => TextLine
  line: (lineNumber: number) => TextLine
  lines: number
}

export interface QueryContext {
  document: DocumentState
  cursor: CursorPosition
}
