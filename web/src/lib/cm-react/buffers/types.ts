import type { Diagnostic } from '@codemirror/lint'

import { defaultEditorPreferences, type EditorPreferences } from '../props'
import { defaultSyntax, Syntax } from '../extensions/syntax'

/**
 * BufferState stores editor settings captured when a buffer is created.
 *
 * A CodeMirror EditorState contains both document content and extension/plugin state.
 * Switching buffers restores a different EditorState, which may no longer match
 * current React props.
 *
 * BufferState is used for that comparison so the editor can apply only the
 * necessary updates (for example theme, input mode, syntax, and diagnostics).
 */
export interface BufferState {
  /**
   * Field to identify whether state is not initial state.
   */
  isInitialised?: boolean

  /**
   * Config sequence number.
   *
   * Used for fast state invalidation check.
   */
  seq: number

  /**
   * Identifies whether document view is in read-only mode.
   */
  readOnly?: boolean

  /**
   * Document name associated with this editor state.
   */
  fileName?: string

  /**
   * Language mode used for current document.
   *
   * Used to track syntax highlight extension state.
   */
  syntax: Syntax

  /**
   * Editor preferences associated with a given state.
   *
   * Used to manage theme, input mode and appearance extension states.
   */
  preferences: EditorPreferences

  /**
   * List of diagnostics for a linter plugin.
   */
  diagnostics?: Diagnostic[]
}

/**
 * Defaults for empty BufferState state field.
 * Editor component should replace it right with actual values after EditorState is created.
 */
export const defaultBufferState: BufferState = {
  seq: -1,
  syntax: defaultSyntax,
  preferences: defaultEditorPreferences,
}
