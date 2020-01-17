import {Action, compose, createStore} from 'redux';

import {ActionType} from './actions';
import { rootReducer } from './reducers';

export interface Store {
    code: string
}

const composeEnhancers = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
export const store = createStore<Store, Action<ActionType>, null, null>(
    rootReducer,
    composeEnhancers(),
);


