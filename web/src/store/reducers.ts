import { connectRouter } from 'connected-react-router';
import { combineReducers } from 'redux';

import {Action, ActionType, FileImportArgs} from './actions';
import {DEMO_CODE} from '../editor/props';
import {EditorState, SettingsState, State, StatusState} from './state';
import { CompilerResponse } from '../services/api';
import localConfig from '../services/config'
import {mapByAction} from './helpers';

const reducers = {
    editor: mapByAction<EditorState>({
        [ActionType.FILE_CHANGE]: (s: EditorState, a: Action<string>) => {
            s.code = a.payload;
            return s;
        },
        [ActionType.IMPORT_FILE]: (s: EditorState, a: Action<FileImportArgs>) => {
            const {contents, fileName} = a.payload;
            console.log('Loaded file "%s"', fileName);
            return {
                code: contents,
                fileName,
            };
        },
        [ActionType.COMPILE_RESULT]: (s: EditorState, a: Action<CompilerResponse>) => {
            if (a.payload.formatted) {
                s.code = a.payload.formatted;
            }

            return s;
        },
    }, {fileName: 'main.go', code: DEMO_CODE}),
    status: mapByAction<StatusState>({
        [ActionType.COMPILE_RESULT]: (s: StatusState, a: Action<CompilerResponse>) => {
            return {
                loading: false,
                lastError: null,
                events: a.payload.events,
            }
        },
        [ActionType.COMPILE_FAIL]: (s: StatusState, a: Action<string>) => {
            return {...s, loading: false, lastError: a.payload}
        },
        [ActionType.LOADING]: (s: StatusState, a: Action<string>) => {
            return {...s, loading: true}
        },
    }, {loading: false}),
    settings: mapByAction<SettingsState>({
        [ActionType.TOGGLE_THEME]: (s: SettingsState, a: Action) => {
            s.darkMode = !s.darkMode;
            localConfig.darkThemeEnabled = s.darkMode;
            return s;
        }
    }, {darkMode: localConfig.darkThemeEnabled})
};

export const getInitialState = (): State => ({
    status: {
        loading: false,
    },
    editor: {
        fileName: 'main.go',
        code: DEMO_CODE
    },
    settings: {
        darkMode: localConfig.darkThemeEnabled
    },
});

export const createRootReducer = history => combineReducers({
    router: connectRouter(history),
    ...reducers,
});
