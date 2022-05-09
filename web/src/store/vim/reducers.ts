import {excludeKeys, mapByAction, Nullable} from '~/store/helpers';
import { Action } from '~/store/actions';
import { VimState, VimMode } from './state';
import { ActionType, VimModeChangeArgs } from './actions';

const initialState: VimState = { mode: VimMode.Normal }

const reducers = mapByAction<Nullable<VimState>>({
  [ActionType.VIM_INIT]: () => initialState,
  [ActionType.VIM_DISPOSE]: () => null,
  [ActionType.VIM_MODE_CHANGE]: (s: Nullable<VimState>, {payload: {mode, subMode}}: Action<VimModeChangeArgs>) => (
    s ? { ...s, mode, subMode} : { mode, subMode }
  ),
  [ActionType.VIM_KEYPRESS]: (s: Nullable<VimState>, {payload}: Action<string>) => (
   s ? { ...s, keyBuffer: s.keyBuffer! + payload} : { ...initialState,  keyBuffer: payload}
  ),
  [ActionType.VIM_COMMAND_DONE]: (s: Nullable<VimState>) => (
    s ? excludeKeys(s, 'keyBuffer') : initialState
  ),
}, null);

export default reducers;
