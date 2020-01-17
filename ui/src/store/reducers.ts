import {Action, ActionType} from './actions';
import {DEMO_CODE} from "../editor/props";
import {State} from "./state";

const initialState = {
    code: DEMO_CODE,
};

type Reducer<T> = (s: State, a: Action<T>) => State;

const reducers: {[k in ActionType]: Reducer<any>} = {
    [ActionType.FILE_CHANGE]: (s, a: Action<string>) => {
        return {code: a.payload};
    },
    [ActionType.IMPORT_FILE]: (s, a: Action<string>) => {
        return s;
    }
};

export function rootReducer(state = initialState, action: Action) {
    console.log('reducer', {state, action});
    const r = reducers[action.type];
    if (!r) {
        return state;
    }

    return reducers[action.type](state, action);
}
