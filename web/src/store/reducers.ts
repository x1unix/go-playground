import {Action, ActionType, FileImportArgs} from './actions';
import {DEMO_CODE} from "../editor/props";
import {State} from "./state";
import { CompilerResponse } from '../services/api';
import localConfig from '../services/config'

const initialState = {
    fileName: 'main.go',
    code: DEMO_CODE,
    darkMode: localConfig.darkThemeEnabled
};

type Reducer<T> = (s: State, a: Action<T>) => State;

const reducers: {[k in ActionType]: Reducer<any>} = {
    [ActionType.FILE_CHANGE]: (s: State, a: Action<string>) => {
        s.code = a.payload;
        return s;
    },
    [ActionType.IMPORT_FILE]: (s: State, a: Action<FileImportArgs>) => {
        console.log('Loaded file "%s"', a.payload.fileName);
        s.code = a.payload.contents;
        s.fileName = a.payload.fileName;
        return s;
    },
    [ActionType.COMPILE_RESULT]: (s: State, a: Action<CompilerResponse>) => {
        s.lastError = null;
        s.events = a.payload.events;

        if (a.payload.formatted) {
            s.code = a.payload.formatted;
        }

        return s;
    },
    [ActionType.COMPILE_FAIL]: (s: State, a: Action<string>) => {
        s.lastError = a.payload;
        return s
    },
    [ActionType.TOGGLE_THEME]: (s: State, a: Action) => {
        s.darkMode = !s.darkMode;
        localConfig.darkThemeEnabled = s.darkMode;
        return s;
    },
};

export function rootReducer(state = initialState, action: Action) {
    const newState = Object.assign({}, state) as State;
    const r = reducers[action.type];
    if (!r) {
        return newState;
    }

    return reducers[action.type](newState, action);
}
