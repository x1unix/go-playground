import type { editor } from 'monaco-editor'
import type { EvalEvent } from '~/services/api'
import type { MonacoSettings, RunTargetConfig } from '~/services/config'
import type { LayoutType } from '~/styles/layout'

import type { VimState } from './vim/state'
import { type NotificationsState } from './notifications/state'
import type { TerminalState } from './terminal/state'
import type { WorkspaceState } from './workspace/state'

export interface UIState {
  shareCreated?: boolean
  snippetId?: string | null
}

export interface StatusState {
  loading: boolean
  running?: boolean
  dirty?: boolean
  lastError?: string | null
  events?: EvalEvent[]
  markers?: Record<string, editor.IMarkerData[] | null>
}

export interface SettingsState {
  darkMode: boolean
  useSystemTheme: boolean
  autoSave: boolean
  autoFormat: boolean
  enableVimMode: boolean
  goProxyUrl: string
}

export interface PanelState {
  height?: number
  widthPercent?: number
  collapsed?: boolean
  layout?: LayoutType
}

export interface State {
  status?: StatusState
  settings: SettingsState
  runTarget: RunTargetConfig
  monaco: MonacoSettings
  panel: PanelState
  ui?: UIState
  vim?: VimState | null
  workspace: WorkspaceState
  notifications: NotificationsState
  terminal: TerminalState
}
