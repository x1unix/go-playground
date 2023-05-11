import {isDarkModeEnabled} from "~/utils/theme";
import config, {RunTargetConfig} from '~/services/config';

import { Dispatcher } from "./utils";
import {PanelState, SettingsState} from "../state";
import { StateProvider, DispatchFn } from "../helpers";
import {
  MonacoParamsChanges,
  newMonacoParamsChangeAction, newPanelStateChangeAction,
  newRunTargetChangeAction,
  newSettingsChangeAction, newToggleThemeAction,
} from "../actions";

export function newMonacoParamsChangeDispatcher(changes: MonacoParamsChanges): Dispatcher {
  return (dispatch: DispatchFn, _: StateProvider) => {
    const current = config.monacoSettings;
    config.monacoSettings = Object.assign(current, changes);
    dispatch(newMonacoParamsChangeAction(changes));
  };
}

export const newSettingsChangeDispatcher = (changes: Partial<SettingsState>): Dispatcher => (
  (dispatch: DispatchFn, _: StateProvider) => {
    if ('useSystemTheme' in changes) {
      config.useSystemTheme = !!changes.useSystemTheme;
      changes.darkMode = isDarkModeEnabled();
    }

    if ('darkMode' in changes) {
      config.darkThemeEnabled = !!changes.darkMode;
    }

    if ('enableVimMode' in changes) {
      config.enableVimMode = !!changes.enableVimMode;
    }

    dispatch(newSettingsChangeAction(changes));
  }
);

export const newRunTargetChangeDispatcher = (cfg: RunTargetConfig): Dispatcher => (
  (dispatch: DispatchFn) => {
    config.runTargetConfig = cfg;
    dispatch(newRunTargetChangeAction(cfg));
  }
);

export const dispatchToggleTheme: Dispatcher =
  (dispatch: DispatchFn, getState: StateProvider) => {
    const { darkMode } = getState().settings;
    config.darkThemeEnabled = !darkMode;
    dispatch(newToggleThemeAction())
  };

export const dispatchPanelLayoutChange = (changes: Partial<PanelState>): Dispatcher => (
  (dispatch: DispatchFn, getState: StateProvider) => {
    const { panel } = getState();
    config.panelLayout = { ...panel, ...changes };
    dispatch(newPanelStateChangeAction(changes));
  }
);
