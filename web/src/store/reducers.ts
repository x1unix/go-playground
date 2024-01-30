import { connectRouter } from 'connected-react-router'
import { combineReducers } from 'redux'

import { type EvalEvent } from '~/services/api'
import config, { type MonacoSettings, type RunTargetConfig } from '~/services/config'

import vimReducers from './vim/reducers'
import notificationReducers from './notifications/reducers'

import { initialTerminalState } from './terminal/state'
import { reducers as terminalReducers } from './terminal/reducers'

import { type FilePayload, WorkspaceAction } from '~/store/workspace/actions'
import { initialWorkspaceState } from '~/store/workspace/state'
import { reducers as workspaceReducers } from '~/store/workspace/reducers'

import {
  type Action,
  ActionType,
  type LoadingStateChanges,
  type MonacoParamsChanges,
  type MarkerChangePayload,
} from './actions'
import { mapByAction } from './helpers'

import { type SettingsState, type State, type StatusState, type PanelState, type UIState } from './state'

// TODO: move settings reducers and state to store/settings
const initialSettingsState: SettingsState = {
  darkMode: config.darkThemeEnabled,
  autoFormat: true,
  useSystemTheme: config.useSystemTheme,
  enableVimMode: config.enableVimMode,
  goProxyUrl: config.goProxyUrl,
}

const reducers = {
  runTarget: mapByAction<RunTargetConfig>(
    {
      [ActionType.RUN_TARGET_CHANGE]: (_, { payload }: Action<RunTargetConfig>) => payload,
    },
    config.runTargetConfig,
  ),
  status: mapByAction<StatusState>(
    {
      [WorkspaceAction.WORKSPACE_IMPORT]: (_: StatusState) => ({
        loading: false,
        running: false,
        dirty: false,
        lastError: null,
      }),
      [WorkspaceAction.SNIPPET_LOAD_FINISH]: (_: StatusState) => ({
        loading: false,
        running: false,
        dirty: false,
        lastError: null,
      }),
      [WorkspaceAction.SNIPPET_LOAD_START]: (_: StatusState) => ({
        loading: true,
        running: false,
        dirty: false,
        lastError: null,
      }),
      [WorkspaceAction.REMOVE_FILE]: (
        { markers, ...state }: StatusState,
        { payload: { filename } }: Action<FilePayload>,
      ) => {
        const { [filename]: _, ...newMarkers } = markers || {}
        return {
          ...state,
          markers: newMarkers,
        }
      },
      [ActionType.ERROR]: (s: StatusState, a: Action<string>) => ({
        ...s,
        loading: false,
        running: false,
        dirty: true,
        lastError: a.payload,
      }),
      [ActionType.LOADING_STATE_CHANGE]: (s: StatusState, { payload: { loading } }: Action<LoadingStateChanges>) => ({
        ...s,
        loading,
        running: false,
      }),
      [ActionType.EVAL_START]: (s: StatusState, _: Action) => ({
        lastError: null,
        loading: false,
        running: true,
        dirty: true,
        events: [],
      }),
      [ActionType.EVAL_EVENT]: (s: StatusState, a: Action<EvalEvent>) => ({
        lastError: null,
        loading: false,
        running: true,
        dirty: true,
        events: s.events ? s.events.concat(a.payload) : [a.payload],
      }),
      [ActionType.EVAL_FINISH]: (s: StatusState, _: Action) => ({
        ...s,
        loading: false,
        running: false,
        dirty: true,
      }),
      [ActionType.RUN_TARGET_CHANGE]: (s: StatusState, { payload }: Action<RunTargetConfig>) => {
        // if (payload.target) {
        //   // Reset build output if build runtime was changed
        //   return { ...s, loading: false, lastError: null }
        // }

        return s
      },
      [ActionType.MARKER_CHANGE]: (s: StatusState, { payload }: Action<MarkerChangePayload>) => ({
        ...s,
        markers: {
          ...s.markers,
          [payload.fileName]: payload.markers || null,
        },
      }),
    },
    { loading: false },
  ),
  settings: mapByAction<SettingsState>(
    {
      [ActionType.TOGGLE_THEME]: (s: SettingsState, a: Action) => {
        s.darkMode = !s.darkMode
        config.darkThemeEnabled = s.darkMode
        return s
      },
      [ActionType.SETTINGS_CHANGE]: (s: SettingsState, { payload }: Action<Partial<SettingsState>>) => ({
        ...s,
        ...payload,
      }),
    },
    initialSettingsState,
  ),
  monaco: mapByAction<MonacoSettings>(
    {
      [ActionType.MONACO_SETTINGS_CHANGE]: (s: MonacoSettings, { payload }: Action<MonacoParamsChanges>) => ({
        ...s,
        ...payload,
      }),
    },
    config.monacoSettings,
  ),
  panel: mapByAction<PanelState>(
    {
      [ActionType.PANEL_STATE_CHANGE]: (s: PanelState, { payload }: Action<PanelState>) => ({
        ...s,
        ...payload,
      }),
    },
    config.panelLayout,
  ),
  ui: mapByAction<UIState>(
    {
      [ActionType.LOADING_STATE_CHANGE]: (s: UIState, { payload: { loading } }: Action<LoadingStateChanges>) => {
        if (!s) {
          return { loading, shareCreated: false, snippetId: null }
        }

        return {
          ...s,
          loading,
        }
      },
      [ActionType.UI_STATE_CHANGE]: (s: UIState, { payload }: Action<Partial<UIState>>) => {
        if (!s) {
          return payload as UIState
        }

        return { ...s, ...payload }
      },
    },
    {},
  ),
  vim: vimReducers,
  notifications: notificationReducers,
  terminal: terminalReducers,
  workspace: workspaceReducers,
}

export const getInitialState = (): State => ({
  status: {
    loading: true,
  },
  settings: initialSettingsState,
  runTarget: config.runTargetConfig,
  monaco: config.monacoSettings,
  panel: config.panelLayout,
  notifications: {},
  vim: null,
  terminal: initialTerminalState,
  workspace: initialWorkspaceState,
})

export const createRootReducer = (history) =>
  combineReducers({
    router: connectRouter(history),
    ...reducers,
  })
