import type { Text } from '@codemirror/state'

/**
 * Input layout type.
 */
export type InputMode = 'default' | 'vim' | 'emacs'

export type ColorScheme = 'dark' | 'light'

export type Callback<T> = (arg: T) => void

export enum Syntax {
  PlainText,
  Go,
  GoMod,
  JSON,
}

export interface DocumentState {
  path: string
  language: Syntax
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
