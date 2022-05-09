import { mapByAction} from '~/store/helpers';
import { Nullable, excludeKeys } from '~/utils/types';
import { Action } from '~/store/actions';
import { VimState, VimMode } from './state';
import { ActionType, VimModeChangeArgs } from './actions';

const vimCommandPrefix = ':';
const initialState: VimState = { mode: VimMode.Normal }

const reducers = mapByAction<Nullable<VimState>>({
  [ActionType.VIM_INIT]: () => initialState,
  [ActionType.VIM_DISPOSE]: () => null,
  [ActionType.VIM_MODE_CHANGE]: (s: Nullable<VimState>, {payload: {mode, subMode}}: Action<VimModeChangeArgs>) => (
    s ? { ...s, mode, subMode} : { mode, subMode }
  ),
  [ActionType.VIM_KEYPRESS]: (s: Nullable<VimState>, {payload}: Action<string>) => {
    const state = s ?? initialState;
    if (!state.commandStarted) {
      const isCommandPrefix = payload === vimCommandPrefix;
      return isCommandPrefix ? { ...state, commandStarted: true, keyBuffer: ''} : state;
    }

    const { keyBuffer } = state;
    return { ...state, commandStarted: true, keyBuffer: keyBuffer + payload};
  },
  [ActionType.VIM_COMMAND_DONE]: (s: Nullable<VimState>) => {
    if (!s) {
      return initialState;
    }

    const { mode, subMode } = s;
    return { mode, subMode };
  },
}, null);

export default reducers;
