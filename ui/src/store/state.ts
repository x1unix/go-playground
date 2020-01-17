import {compose, createStore, Store} from 'redux';
import { connect } from 'react-redux';

import { Action } from './actions';
import { rootReducer } from './reducers';
import { EvalEvent } from '../services/api';

export interface State {
    fileName: string
    code: string
    lastError?: string | null
    events?: EvalEvent[]
}

const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
export const store = createStore<State, Action, null, null>(
    rootReducer,
    composeEnhancers(),
) as Store<State, Action>;

export function Connect(fn: (state: State) => any) {
    return function (constructor: Function) {
        return connect(fn)(constructor);
    }
}


