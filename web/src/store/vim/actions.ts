import { VimState } from '~/store/vim/state';

export enum ActionType {
  VIM_INIT = 'VIM_INIT',
  VIM_DISPOSE = 'VIM_DISPOSE',
  VIM_MODE_CHANGE = 'VIM_MODE_CHANGE',
  VIM_KEYPRESS = 'VIM_KEYPRESS',
  VIM_COMMAND_DONE = 'VIM_COMMAND_DONE'
}

/**
 * VimModeChangeArgs represents current selected mode and sub-mode.
 *
 * @see monaco-vim/lib/statusbar.js
 */
export type VimModeChangeArgs = Pick<VimState, 'mode' | 'subMode'>;

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

export const newVimKeyPressAction = (key: string) => ({
  type: ActionType.VIM_KEYPRESS,
  payload: key
});

export const newVimCommandDoneAction = () => ({
  type: ActionType.VIM_COMMAND_DONE
});
