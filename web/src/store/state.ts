import { connect } from 'react-redux';
import {editor} from 'monaco-editor';
import { EvalEvent } from '~/services/api';
import {MonacoSettings, RunTargetConfig} from '~/services/config';
import {LayoutType} from '~/styles/layout';

import { VimState } from './vim/state';
import { NotificationsState } from './notifications/state';
import { TerminalState } from './terminal/state';

export interface UIState {
  shareCreated?: boolean
  snippetId?: string | null
}

export interface EditorState {
  fileName: string,
  code: string
}

export interface StatusState {
  loading: boolean,
  running?: boolean,
  dirty?: boolean,
  lastError?: string | null,
  events?: EvalEvent[],
  markers?: editor.IMarkerData[]
}

export interface SettingsState {
  darkMode: boolean
  useSystemTheme: boolean
  autoFormat: boolean,
  enableVimMode: boolean
  goProxyUrl: string
}

export interface PanelState {
  height ?: string|number
  width ?: string|number
  collapsed ?: boolean
  layout?: LayoutType
}

export interface State {
  editor: EditorState
  status?: StatusState,
  settings: SettingsState
  runTarget: RunTargetConfig
  monaco: MonacoSettings
  panel: PanelState
  ui?: UIState
  vim?: VimState | null
  notifications: NotificationsState
  terminal: TerminalState
}

export function Connect(fn: (state: State) => any) {
  return function (constructor: Function) {
    return connect(fn)(constructor as any) as any;
  }
}
