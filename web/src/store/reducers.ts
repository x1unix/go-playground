import { connectRouter } from 'connected-react-router';
import { combineReducers } from 'redux';
import {editor} from 'monaco-editor';

import { RunResponse, EvalEvent } from '~/services/api';
import config, {
  MonacoSettings,
  RunTargetConfig
} from '~/services/config';

import vimReducers from './vim/reducers';
import notificationReducers from './notifications/reducers';
import { Action, ActionType, FileImportArgs, MonacoParamsChanges } from './actions';
import { mapByAction } from './helpers';

import {
  EditorState,
  SettingsState,
  State,
  StatusState,
  PanelState,
  UIState,
} from './state';

const reducers = {
  runTarget: mapByAction<RunTargetConfig>({
    [ActionType.RUN_TARGET_CHANGE]: (_, {payload}: Action<RunTargetConfig>) => (
      payload
    ),
  }, config.runTargetConfig),
  editor: mapByAction<EditorState>({
    [ActionType.FILE_CHANGE]: (s: EditorState, {payload: code}: Action<string>) => (
      {
        ...s,
        code
      }
    ),
    [ActionType.IMPORT_FILE]: (s: EditorState, a: Action<FileImportArgs>) => {
      const { contents: code, fileName } = a.payload;
      console.log('Loaded file "%s"', fileName);
      return {
        code,
        fileName,
      };
    },
    [ActionType.FORMAT_CODE]: (s: EditorState, {payload: code}: Action<string>) => (
      {
        ...s,
        code,
      }
    ),
  }, { fileName: 'main.go', code: '' }),
  status: mapByAction<StatusState>({
    [ActionType.IMPORT_FILE]: (_: StatusState) => (
      {
        loading: false,
        running: false,
        dirty: false,
        lastError: null,
      }
    ),
    [ActionType.ERROR]: (s: StatusState, a: Action<string>) => (
      {
        ...s,
        loading: false,
        running: false,
        dirty: true,
        lastError: a.payload
      }
    ),
    [ActionType.LOADING]: (s: StatusState, _: Action) => (
      {
        ...s,
        loading: true,
        running: false,
      }
    ),
    [ActionType.EVAL_START]: (s: StatusState, _: Action) => (
      {
        lastError: null,
        loading: false,
        running: true,
        dirty: true,
        events: []
      }
    ),
    [ActionType.EVAL_EVENT]: (s: StatusState, a: Action<EvalEvent>) => (
      {
        lastError: null,
        loading: false,
        running: true,
        dirty: true,
        events: s.events ?
            s.events.concat(a.payload) : [a.payload],
      }
    ),
    [ActionType.EVAL_FINISH]: (s: StatusState, _: Action) => (
      {
        ...s,
        loading: false,
        running: false,
        dirty: true
      }
    ),
    [ActionType.RUN_TARGET_CHANGE]: (s: StatusState, {payload}: Action<RunTargetConfig>) => {
      // if (payload.target) {
      //   // Reset build output if build runtime was changed
      //   return { ...s, loading: false, lastError: null }
      // }

      return s;
    },
    [ActionType.MARKER_CHANGE]: (s: StatusState, { payload }: Action<editor.IMarkerData[]>) => (
      {
        ...s,
        markers: payload,
      }
    )
  }, { loading: false }),
  settings: mapByAction<SettingsState>({
    [ActionType.TOGGLE_THEME]: (s: SettingsState, a: Action) => {
      s.darkMode = !s.darkMode;
      config.darkThemeEnabled = s.darkMode;
      return s;
    },
    [ActionType.SETTINGS_CHANGE]: (s: SettingsState, {payload}: Action<Partial<SettingsState>>) => (
      {
        ...s,
        ...payload
      }
    )
  },
    {
      darkMode: config.darkThemeEnabled,
      autoFormat: true,
      useSystemTheme: config.useSystemTheme,
      enableVimMode: config.enableVimMode,
      goProxyUrl: config.goProxyUrl,
    }
  ),
  monaco: mapByAction<MonacoSettings>({
    [ActionType.MONACO_SETTINGS_CHANGE]: (s: MonacoSettings, {payload}: Action<MonacoParamsChanges>) => (
      {
        ...s,
        ...payload
      }
    )
  }, config.monacoSettings),
  panel: mapByAction<PanelState>({
    [ActionType.PANEL_STATE_CHANGE]: (s: PanelState, {payload}: Action<PanelState>) => (
      {
        ...s,
        ...payload
      }
    )
  }, config.panelLayout),
  ui: mapByAction<UIState>({
    [ActionType.LOADING]: (s: UIState, _: Action<Partial<UIState>>) => {
      if (!s) {
        return { shareCreated: false, snippetId: null };
      }

      return {
        ...s,
        shareCreated: false, snippetId: null
      };
    },
    [ActionType.UI_STATE_CHANGE]: (s: UIState, { payload }: Action<Partial<UIState>>) => {
      if (!s) {
        return payload as UIState;
      }

      return { ...s, ...payload };
    }
  }, {}),
  vim: vimReducers,
  notifications: notificationReducers,
};

export const getInitialState = (): State => ({
  status: {
    loading: true
  },
  editor: {
    fileName: 'prog.go',
    code: ''
  },
  settings: {
    darkMode: config.darkThemeEnabled,
    autoFormat: config.autoFormat,
    useSystemTheme: config.useSystemTheme,
    enableVimMode: config.enableVimMode,
    goProxyUrl: config.goProxyUrl,
  },
  runTarget: config.runTargetConfig,
  monaco: config.monacoSettings,
  panel: config.panelLayout,
  notifications: {},
  vim: null
});

export const createRootReducer = history => combineReducers({
  router: connectRouter(history),
  ...reducers,
});
