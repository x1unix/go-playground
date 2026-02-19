import type { Text } from '@codemirror/state'

/**
 * Input layout type.
 */
export type InputMode = 'default' | 'vim' | 'emacs'

export type ColorScheme = 'dark' | 'light'

type CallbackSlot<T> = (callback: T) => void

interface BaseInputListener {
  /**
   * Attaches input listener to editor to start intercepting input.
   */
  attach?: () => void
}

export interface VimInputListener extends BaseInputListener {
  mode: 'vim'
  onModeChange: CallbackSlot<(mode: string) => void>
  onKeyPress: CallbackSlot<(key: string) => void>
  onCommandDone: CallbackSlot<() => void>
  onDispose: CallbackSlot<() => void>
}

export interface EmacsInputListener extends BaseInputListener {
  mode: 'emacs'
  onDidMarkChange: CallbackSlot<(isMarkSet: boolean) => void>
  onDidChangeKey: CallbackSlot<(key: string) => void>
}

export type InputListener = EmacsInputListener | VimInputListener

export type Callback<T> = (arg: T) => void

export interface DocumentState {
  path: string
  text: Text
}

export interface Position {
  /**
   * Line number. Starts at 1.
   */
  readonly line: number
  readonly column: number
}

export interface Range {
  readonly start: Position
  readonly end: Position
}

export interface Marker extends Position {
  message: string
  severity?: 'info' | 'warning' | 'error'
}

export interface FormatResult {
  content?: string
  markers?: Marker[]
}

/**
 * EditorRemote interface provides offscreen control over editor instance.
 */
export interface EditorRemote {
  /**
   * Cursor position change listener.
   */
  onCursorPositionChange?: Callback<Position>

  /**
   * Input mode change listener.
   * Fired when mode changed between vim and emacs.
   *
   * Null value is passed when mode switched back to regular.
   */
  onInputModeChange?: Callback<InputListener | null>

  /**
   * Event listener to track whether editor is blocked by loading some resources (for example input method extensions).
   */
  onLoadingStateChange?: Callback<boolean>

  /**
   * Applies document formatting.
   */
  formatDocument: () => void

  /**
   * Focuses editor instance.
   */
  focus: () => void

  /**
   * Detach from editor instance and free resources.
   */
  dispose: () => void
}
