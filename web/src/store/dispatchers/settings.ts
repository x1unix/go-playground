import { isDarkModeEnabled } from '~/utils/theme'
import config, { type RunTargetConfig } from '~/services/config'

import { type Dispatcher } from './utils'
import { type PanelState, type SettingsState } from '../state'
import { type StateProvider, type DispatchFn } from '../helpers'
import {
  type MonacoParamsChanges,
  newMonacoParamsChangeAction,
  newPanelStateChangeAction,
  newRunTargetChangeAction,
  newSettingsChangeAction,
  newToggleThemeAction,
} from '../actions'
import { saveWorkspaceState, truncateWorkspaceState } from '../workspace/config'

export function newMonacoParamsChangeDispatcher(changes: MonacoParamsChanges): Dispatcher {
  return (dispatch: DispatchFn, _: StateProvider) => {
    const current = config.monacoSettings
    config.monacoSettings = Object.assign(current, changes)
    dispatch(newMonacoParamsChangeAction(changes))
  }
}

export const newSettingsChangeDispatcher =
  (changes: Partial<SettingsState>): Dispatcher =>
  (dispatch: DispatchFn, getState: StateProvider) => {
    if ('useSystemTheme' in changes) {
      config.useSystemTheme = !!changes.useSystemTheme
      changes.darkMode = isDarkModeEnabled()
    }

    if ('darkMode' in changes) {
      config.darkThemeEnabled = !!changes.darkMode
    }

    if ('enableVimMode' in changes) {
      config.enableVimMode = !!changes.enableVimMode
    }

    if ('autoSave' in changes) {
      config.autoSave = !!changes.autoSave

      // Immediately save workspace
      if (changes.autoSave) {
        const { workspace } = getState()
        if (!workspace.snippet?.id) {
          saveWorkspaceState(workspace)
        }
      } else {
        truncateWorkspaceState()
      }
    }

    dispatch(newSettingsChangeAction(changes))
  }

export const newRunTargetChangeDispatcher =
  (cfg: RunTargetConfig): Dispatcher =>
  (dispatch: DispatchFn) => {
    config.runTargetConfig = cfg
    dispatch(newRunTargetChangeAction(cfg))
  }

export const dispatchToggleTheme: Dispatcher = (dispatch: DispatchFn, getState: StateProvider) => {
  const { darkMode } = getState().settings
  config.darkThemeEnabled = !darkMode
  dispatch(newToggleThemeAction())
}

export const dispatchPanelLayoutChange =
  (changes: Partial<PanelState>): Dispatcher =>
  (dispatch: DispatchFn, getState: StateProvider) => {
    const { panel } = getState()
    config.panelLayout = { ...panel, ...changes }
    dispatch(newPanelStateChangeAction(changes))
  }
