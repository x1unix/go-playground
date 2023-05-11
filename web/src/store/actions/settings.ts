import { MonacoSettings, RunTargetConfig } from "~/services/config";

import { ActionType } from "./actions";
import { PanelState, SettingsState } from "../state";

export type MonacoParamsChanges<T = any> = {
  [k in keyof MonacoSettings | string]: T;
};

export const newToggleThemeAction = () => (
  {
    type: ActionType.TOGGLE_THEME,
    payload: null,
  }
);

export const newRunTargetChangeAction = (cfg: RunTargetConfig) => (
  {
    type: ActionType.RUN_TARGET_CHANGE,
    payload: cfg
  }
);

export const newMonacoParamsChangeAction = <T>(changes: MonacoParamsChanges<T>) => (
  {
    type: ActionType.MONACO_SETTINGS_CHANGE,
    payload: changes
  }
);

export const newSettingsChangeAction = (changes: Partial<SettingsState>) => (
  {
    type: ActionType.SETTINGS_CHANGE,
    payload: changes
  }
);

export const newPanelStateChangeAction = (changes: Partial<PanelState>) => (
  {
    type: ActionType.PANEL_STATE_CHANGE,
    payload: changes
  }
);
