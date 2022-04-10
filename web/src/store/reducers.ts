import { connectRouter } from 'connected-react-router';
import { combineReducers } from 'redux';
import {editor} from "monaco-editor";

import { Action, ActionType, FileImportArgs, BuildParamsArgs, MonacoParamsChanges } from './actions';
import { RunResponse, EvalEvent } from '~/services/api';
import localConfig, { MonacoSettings, RuntimeType } from '~/services/config'
import { mapByAction } from './helpers';
import config from '~/services/config';
import {defaultPanelProps} from '~/styles/layout';
import {
  EditorState,
  SettingsState,
  State,
  StatusState,
  PanelState,
  UIState,
} from './state';

const reducers = {
  editor: mapByAction<EditorState>({
    [ActionType.FILE_CHANGE]: (s: EditorState, a: Action<string>) => {
      s.code = a.payload;
      return s;
    },
    [ActionType.IMPORT_FILE]: (s: EditorState, a: Action<FileImportArgs>) => {
      const { contents, fileName } = a.payload;
      console.log('Loaded file "%s"', fileName);
      return {
        code: contents,
        fileName,
      };
    },
    [ActionType.COMPILE_RESULT]: (s: EditorState, a: Action<RunResponse>) => {
      if (a.payload.formatted) {
        s.code = a.payload.formatted;
      }

      return s;
    },
  }, { fileName: 'main.go', code: '' }),
  status: mapByAction<StatusState>({
    [ActionType.COMPILE_RESULT]: (s: StatusState, a: Action<RunResponse>) => {
      return {
        loading: false,
        lastError: null,
        events: a.payload.events,
      }
    },
    [ActionType.IMPORT_FILE]: (s: StatusState, a: Action<string>) => {
      return { ...s, loading: false, lastError: null }
    },
    [ActionType.ERROR]: (s: StatusState, a: Action<string>) => {
      return { ...s, loading: false, lastError: a.payload }
    },
    [ActionType.LOADING]: (s: StatusState, _: Action<string>) => {
      return { ...s, loading: true }
    },
    [ActionType.EVAL_START]: (s: StatusState, _: Action) => {
      return { lastError: null, loading: false, events: [] }
    },
    [ActionType.EVAL_EVENT]: (s: StatusState, a: Action<EvalEvent>) => {
      return { lastError: null, loading: false, events: s.events?.concat(a.payload) }
    },
    [ActionType.EVAL_FINISH]: (s: StatusState, _: Action) => {
      return { ...s, loading: false }
    },
    [ActionType.BUILD_PARAMS_CHANGE]: (s: StatusState, a: Action<BuildParamsArgs>) => {
      if (a.payload.runtime) {
        // Reset build output if build runtime was changed
        return { loading: false, lastError: null }
      }

      return s;
    },
    [ActionType.MARKER_CHANGE]: (s: StatusState, { payload }: Action<editor.IMarkerData[]>) => {
      return {
        ...s,
        markers: payload,
      }
    }
  }, { loading: false }),
  settings: mapByAction<SettingsState>({
    [ActionType.TOGGLE_THEME]: (s: SettingsState, a: Action) => {
      s.darkMode = !s.darkMode;
      localConfig.darkThemeEnabled = s.darkMode;
      return s;
    },
    [ActionType.BUILD_PARAMS_CHANGE]: (s: SettingsState, a: Action<BuildParamsArgs>) => {
      return Object.assign({}, s, a.payload);
    },
    [ActionType.ENVIRONMENT_CHANGE]: (s: SettingsState, { payload }: Action<RuntimeType>) => ({
      ...s, runtime: payload,
    })
  }, { darkMode: localConfig.darkThemeEnabled, autoFormat: true, runtime: RuntimeType.GoPlayground }),
  monaco: mapByAction<MonacoSettings>({
    [ActionType.MONACO_SETTINGS_CHANGE]: (s: MonacoSettings, a: Action<MonacoParamsChanges>) => {
      return Object.assign({}, s, a.payload);
    }
  }, config.monacoSettings),
  panel: mapByAction<PanelState>({
    [ActionType.PANEL_STATE_CHANGE]: (s: PanelState, {payload}: Action<PanelState>) => ({
      ...s, ...payload
    })
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
  }, {})
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
    darkMode: localConfig.darkThemeEnabled,
    autoFormat: localConfig.autoFormat,
    runtime: localConfig.runtimeType,
  },
  monaco: config.monacoSettings,
  panel: defaultPanelProps
});

export const createRootReducer = history => combineReducers({
  router: connectRouter(history),
  ...reducers,
});
