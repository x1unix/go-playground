import type { BufferStateStore } from './buffers/store'
import { defaultThemeConfig } from './extensions/themes'
import type { DocumentState, InputMode, ColorScheme, EditorRemote, EditorEvent } from './types'
import { HotkeyCommand } from './types'

export type { Text } from '@codemirror/state'

export interface Document {
  /**
   * Absolute document file path.
   */
  path: string

  /**
   * Function or value to retreive initial value.
   *
   * Used once to populate initial editor contents.
   */
  content: string
}

export const defaultEditorPreferences: EditorPreferences = {
  ...defaultThemeConfig,
  inputMode: 'default',
  tabSize: 4,
  showLineNumbers: true,
}

export interface EditorPreferences {
  /**
   * Editor color scheme variant (dark or light).
   */
  colorScheme: ColorScheme

  /**
   * Editor font family.
   */
  fontFamily: string

  /**
   * Editor font size.
   */
  fontSize: number

  /**
   * Tab size.
   */
  tabSize: number

  /**
   * Controls whether editor should use regular or vim/emacs input mode.
   *
   * Regular is default mode.
   */
  inputMode: InputMode

  /**
   * Whether to show line numbers.
   */
  showLineNumbers: boolean
}

export interface EditorProps {
  /**
   * Editor appearance preferences.
   */
  preferences?: EditorPreferences

  /**
   * Whether content is read-only and not editable.
   */
  readonly?: boolean

  /**
   * Custom per-document state store.
   *
   * Consumers can provide external instance to remove unused instances.
   */
  store?: BufferStateStore

  /**
   * Workspace identifier for document store state invalidation.
   *
   * Changing the workspace key will trigger document contents re-read.
   */
  workspaceKey?: string | null

  /**
   * Sets currently open document.
   *
   * [Document.content] is used only once to initialize file buffer contents.
   * Update the [workspaceKey] value to truncate buffer state.
   *
   * When file content is async function, content load error events can be observed with `onEvent` handler.
   */
  value?: Document

  /**
   * Value change handler.
   */
  onChange?: (e: DocumentState) => void

  /**
   * Component mount hook.
   */
  onMount?: (r: EditorRemote) => void

  /**
   * Editor event handler.
   */
  onEvent?: (e: EditorEvent) => void

  /**
   * Gutter click event handler.
   */
  onHotkeyCommand?: (cmd: HotkeyCommand, doc: DocumentState, rem: EditorRemote) => void
}
