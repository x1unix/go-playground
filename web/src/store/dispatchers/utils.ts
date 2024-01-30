import { type DispatchFn, type StateProvider } from '../helpers'
import { type Action } from '../actions'

export type Dispatcher = (dispatch: DispatchFn, getState: StateProvider) => void

export type StateDispatch = <V = any, T = string>(v: Action<T, V> | Dispatcher) => void
