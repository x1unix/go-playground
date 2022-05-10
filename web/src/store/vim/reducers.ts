import { mapByAction} from '~/store/helpers';
import { Nullable } from '~/utils/types';
import { Action } from '~/store/actions';
import {VimState, VimMode, ConfirmMessage} from './state';
import {ActionType, VimKeyPressArgs, VimModeChangeArgs} from './actions';

const initialState: VimState = { mode: VimMode.Normal }

const reducers = mapByAction<Nullable<VimState>>({
  [ActionType.VIM_INIT]: () => initialState,
  [ActionType.VIM_DISPOSE]: () => null,
  [ActionType.VIM_MODE_CHANGE]: (s: Nullable<VimState>, {payload: {mode, subMode}}: Action<VimModeChangeArgs>) => (
    s ? { ...s, mode, subMode} : { mode, subMode }
  ),
  [ActionType.VIM_KEYPRESS]: (s: Nullable<VimState>, {payload: {key, replaceContents}}: Action<VimKeyPressArgs>) => {
    const state = s ?? initialState;
    if (!state.commandStarted) {
      return state;
    }

    const { keyBuffer } = state;
    const newContent = replaceContents ? key : keyBuffer + key;
    return { ...state, commandStarted: true, keyBuffer: newContent};
  },
  [ActionType.VIM_KEYDEL]: (s: Nullable<VimState>) => {
    const state = s ?? initialState;
    const keyBuffer = state.keyBuffer?.slice(0, -1);
    if (!keyBuffer) {
      const { mode, subMode } = state;
      return { mode, subMode };
    }

    return { ...state, keyBuffer};
  },
  [ActionType.VIM_COMMAND_START]: (s: Nullable<VimState>, {payload}: Action<string>) => {
    const state = s ?? initialState;
    const { mode, subMode } = state;
    return { mode, subMode, commandStarted: true, keyBuffer: payload ?? ''};
  },
  [ActionType.VIM_COMMAND_DONE]: (s: Nullable<VimState>) => {
    if (!s) {
      return initialState;
    }

    const { mode, subMode } = s;
    return { mode, subMode };
  },
  [ActionType.VIM_SHOW_CONFIRM]: (s: Nullable<VimState>, {payload}: Action<ConfirmMessage>) => {
    const {mode, subMode} = s ?? initialState;
    return {
      mode, subMode,
      confirmMessage: payload,
    }
  }
}, null);

export default reducers;
