import { VimState } from '~/store/vim/state';
import {Nullable} from "~/utils/types";

export enum ActionType {
  VIM_INIT = 'VIM_INIT',
  VIM_DISPOSE = 'VIM_DISPOSE',
  VIM_MODE_CHANGE = 'VIM_MODE_CHANGE',
  VIM_KEYPRESS = 'VIM_KEYPRESS',
  VIM_KEYDEL = 'VIM_KEYDEL',
  VIM_COMMAND_START = 'VIM_COMMAND_START',
  VIM_COMMAND_DONE = 'VIM_COMMAND_DONE',
  VIM_SHOW_CONFIRM = 'VIM_SHOW_CONFIRM'
}

/**
 * VimModeChangeArgs represents current selected mode and sub-mode.
 *
 * @see monaco-vim/lib/statusbar.js
 */
export type VimModeChangeArgs = Pick<VimState, 'mode' | 'subMode'>;

export interface VimKeyPressArgs {
  key: string
  replaceContents: boolean
}

export const newVimInitAction = () => ({
  type: ActionType.VIM_INIT
});

export const newVimDisposeAction = () => ({
  type: ActionType.VIM_DISPOSE
});

export const newVimModeChangeAction = (payload: VimModeChangeArgs) => ({
  type: ActionType.VIM_MODE_CHANGE,
  payload
});

export const newVimKeyPressAction = (key: string, replaceContents = false) => ({
  type: ActionType.VIM_KEYPRESS,
  payload: {key, replaceContents}
});

export const newVimKeyDeleteAction = () => ({
  type: ActionType.VIM_KEYDEL
});

export const newVimCommandStartAction = (commandSuffix?: Nullable<string>) => ({
  type: ActionType.VIM_COMMAND_START,
  payload: commandSuffix ?? ''
})

export const newVimCommandDoneAction = () => ({
  type: ActionType.VIM_COMMAND_DONE
});

export const newVimConfirmAction = (msg: string) => ({
  type: ActionType.VIM_SHOW_CONFIRM,
  payload: msg
});
