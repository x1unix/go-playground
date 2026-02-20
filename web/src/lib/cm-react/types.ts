import type { Diagnostic } from '@codemirror/lint'
import type { Text } from '@codemirror/state'

/**
 * Input layout type.
 */
export type InputMode = 'default' | 'vim' | 'emacs'

export type ColorScheme = 'dark' | 'light'

export type Callback<T> = (arg: T) => void

export interface DocumentState {
  path: string
  text: Text
}

export type HotkeyHandler = (cmd: HotkeyCommand, doc: DocumentState, rem: EditorRemote) => void

export enum HotkeyCommand {
  Empty,
  Run,
  Format,
  Share,
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

export enum EventType {
  CursorPositionChanged,
  GutterClick,
  LoadingStateChange,
  InputModeChanged,
  VimInputCommandPress,
  VimInputCommandDone,
  EmacsMarkChanged,
  EmacsKeyChanged,
}

type EventPayloads = {
  [EventType.CursorPositionChanged]: { position: Position }
  [EventType.GutterClick]: { position: Position }
  [EventType.LoadingStateChange]: { isLoading: boolean }
  [EventType.InputModeChanged]: { mode: InputMode }
  [EventType.VimInputCommandPress]: { command: string }
  [EventType.VimInputCommandDone]: { command: string }
  [EventType.EmacsMarkChanged]: { isMarkSet: boolean }
  [EventType.EmacsKeyChanged]: { value: string }
}

export type EditorEvent = {
  [K in keyof EventPayloads]: { type: K } & EventPayloads[K]
}[keyof EventPayloads]

export type EventOf<T extends EventType> = Extract<EditorEvent, { type: T }>

export interface DiagnosticsProvider {
  // TODO: refine interface
  getDiagnostics: () => Promise<Diagnostic[]>
}

/**
 * EditorRemote interface provides offscreen control over editor instance.
 */
export interface EditorRemote {
  /**
   * Applies document formatting.
   */
  formatDocument: (path: string) => void

  /**
   * Invalidates document contents.
   *
   * Triggers editor to explicitly update document contents and diagnostics.
   */
  invalidateDocument: (path: string) => void

  /**
   * Focuses editor instance.
   */
  focus: () => void

  /**
   * Detach from editor instance and free resources.
   */
  dispose: () => void
}
