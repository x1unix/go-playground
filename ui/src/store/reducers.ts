import {Action} from 'redux';
import {ActionType} from './actions';
import {DEMO_CODE} from "../editor/props";

const initialState = {
    code: DEMO_CODE,
};

export function rootReducer(state = initialState, action: Action<ActionType>) {
    console.log('reducer', {state, action});
    return state;
}
