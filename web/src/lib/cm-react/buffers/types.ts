import type { Diagnostic } from '@codemirror/lint'

import type { InputMode } from '../../common'
import { defaultSyntax, type Syntax } from '../extensions/syntax'

/**
 * BufferState keeps document metadata and editor config that were present during buffer creation.
 * CodeMirror editor state is responsible not just for active document state but also for a whole editor state in general, including plugins list (and their states).
 *
 * Switching between different documents (buffers) means swithing between different CM states.
 * Every time the editor state changes, it needs to be "synced" with Editor component settings.
 *
 * The BufferState records the state of Editor component settings (props) for a period when buffer
 *  was created and used to do change detection and dispatch necessary changes to sync restored editor state (plugins, input mode, etc).
 *
 * React component toggles CodeMirror extensions using data in StateData.
 */
export interface BufferState {
  /**
   * Field to identify whether state is not initial state.
   */
  isInitialised?: boolean

  /**
   * Document name associated with this editor state.
   */
  fileName?: string

  /**
   * Editor theme used when EditorState was created.
   * Used to track if theme extension for document state needs to be updated.
   */
  theme: 'dark' | 'light'

  /**
   * Identifies whether document view is in read-only mode.
   */
  readOnly?: boolean

  /**
   * Input method used when editor was created.
   */
  inputMode: InputMode

  /**
   * Language mode used for current document.
   *
   * Used by React component to track if syntax highlight extension should be changed.
   */
  syntax: Syntax

  /**
   * List of diagnostics for a linter plugin.
   */
  diagnostics?: Diagnostic[]
}

/**
 * Defaults for empty StateData state field.
 * Editor component should replace it right with actual values after EditorState is created.
 */
export const defaultStateData: StateData = {
  theme: 'light',
  syntax: defaultSyntax,
  inputMode: 'classic',
}
