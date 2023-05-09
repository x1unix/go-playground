import {editor} from "monaco-editor";
import {PanelState, SettingsState, UIState} from './state';
import { RunResponse, EvalEvent } from '~/services/api';
import {MonacoSettings, RunTargetConfig} from '~/services/config';

export enum ActionType {
  IMPORT_FILE = 'IMPORT_FILE',
  FILE_CHANGE = 'FILE_CHANGE',
  LOADING = 'LOADING',
  ERROR = 'ERROR',
  COMPILE_RESULT = 'COMPILE_RESULT',
  TOGGLE_THEME = 'TOGGLE_THEME',
  RUN_TARGET_CHANGE = 'RUN_TARGET_CHANGE',
  MONACO_SETTINGS_CHANGE = 'MONACO_SETTINGS_CHANGE',
  UI_STATE_CHANGE = 'UI_STATE_CHANGE',
  MARKER_CHANGE = 'MARKER_CHANGE',
  PANEL_STATE_CHANGE = 'PANEL_STATE_CHANGE',
  SETTINGS_CHANGE = 'SETTINGS_CHANGE',

  // Special actions used by Go WASM bridge
  EVAL_START = 'EVAL_START',
  EVAL_EVENT = 'EVAL_EVENT',
  EVAL_FINISH = 'EVAL_FINISH'
}

export interface Action<T = any, A = ActionType> {
  type: A
  payload: T
}

export interface FileImportArgs {
  fileName: string
  contents: string
}

export type MonacoParamsChanges<T = any> = {
  [k in keyof MonacoSettings | string]: T;
};

export const newImportFileAction = (fileName: string, contents: string) =>
({
  type: ActionType.IMPORT_FILE,
  payload: { fileName, contents },
});

export const newFileChangeAction = (contents: string) =>
({
  type: ActionType.FILE_CHANGE,
  payload: contents,
});

export const newBuildResultAction = (resp: RunResponse) =>
({
  type: ActionType.COMPILE_RESULT,
  payload: resp,
});

export const newErrorAction = (err: string) =>
({
  type: ActionType.ERROR,
  payload: err,
});

export const newMarkerAction = (markers?: editor.IMarkerData[]) =>
({
  type: ActionType.MARKER_CHANGE,
  payload: markers,
})

export const newToggleThemeAction = () =>
({
  type: ActionType.TOGGLE_THEME,
  payload: null,
});

export const newLoadingAction = () =>
({
  type: ActionType.LOADING,
  payload: null,
});

export const newRunTargetChangeAction = (cfg: RunTargetConfig) => ({
  type: ActionType.RUN_TARGET_CHANGE,
  payload: cfg
});

export const newMonacoParamsChangeAction = <T>(changes: MonacoParamsChanges<T>) =>
({
  type: ActionType.MONACO_SETTINGS_CHANGE,
  payload: changes
});

export const newSettingsChangeAction = (changes: Partial<SettingsState>) => (
  {
    type: ActionType.SETTINGS_CHANGE,
    payload: changes
  }
);

export const newProgramWriteAction = (event: EvalEvent) =>
({
  type: ActionType.EVAL_EVENT,
  payload: event
});

export const newUIStateChangeAction = (changes: Partial<UIState>) =>
({
  type: ActionType.UI_STATE_CHANGE,
  payload: changes
});

export const newPanelStateChangeAction = (changes: Partial<PanelState>) =>
({
  type: ActionType.PANEL_STATE_CHANGE,
  payload: changes
});
