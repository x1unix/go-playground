export enum ActionType {
  IMPORT_FILE             = 'IMPORT_FILE',
  FILE_CHANGE             = 'FILE_CHANGE',
  LOADING_STATE_CHANGE    = 'LOADING_STATE_CHANGE',
  ERROR                   = 'ERROR',
  FORMAT_CODE             = 'FORMAT_CODE',
  TOGGLE_THEME            = 'TOGGLE_THEME',
  RUN_TARGET_CHANGE       = 'RUN_TARGET_CHANGE',
  MONACO_SETTINGS_CHANGE  = 'MONACO_SETTINGS_CHANGE',
  UI_STATE_CHANGE         = 'UI_STATE_CHANGE',
  MARKER_CHANGE           = 'MARKER_CHANGE',
  PANEL_STATE_CHANGE      = 'PANEL_STATE_CHANGE',
  SETTINGS_CHANGE         = 'SETTINGS_CHANGE',

  // Special actions used by Go WASM bridge
  EVAL_START = 'EVAL_START',
  EVAL_EVENT = 'EVAL_EVENT',
  EVAL_FINISH = 'EVAL_FINISH'
}

export interface Action<T = any, A = string> {
  type: A
  payload: T
}
