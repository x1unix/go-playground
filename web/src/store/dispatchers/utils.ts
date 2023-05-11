import {DispatchFn, StateProvider} from "../helpers";
import { Action } from "../actions";

export type Dispatcher = (dispatch: DispatchFn, getState: StateProvider) => void

export type StateDispatch = <V=any,T=string>(v: Action<T, V> | Dispatcher) => void;
