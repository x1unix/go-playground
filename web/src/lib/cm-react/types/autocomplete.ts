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

/**
 * Adapter contract used by the CodeMirror autocomplete extension.
 *
 * Implementations bridge editor-level requests (offsets, buffer updates)
 * and completion/hover providers (worker, index, or remote services).
 */
export interface EditorAutocompleteSource {
  /** Returns whether this source can provide results for the given syntax. */
  supportsSyntax: (syntax: Syntax) => boolean

  /**
   * Ensures underlying completion data is ready.
   * Returns `true` when warm-up is complete and queries can run immediately.
   */
  isWarmUp: () => Promise<boolean>

  /**
   * Produces completion candidates for the current cursor position.
   * Returns `null` when no completions should be shown.
   */
  complete: (req: CompletionRequest) => Promise<CompletionResult | null>

  /**
   * Produces hover content for the current cursor position.
   * Returns `null` when no hover tooltip should be shown.
   */
  hover: (req: HoverRequest) => Promise<HoverResult | null>

  /**
   * Notifies the source about document edits so it can invalidate/update caches.
   */
  handleDocumentUpdate: (update: DocumentUpdate) => void

  /**
   * Clears cached data for one document or the full source state.
   */
  clear: (path?: string) => void

  /** Releases resources held by the source instance. */
  dispose?: () => void
}
