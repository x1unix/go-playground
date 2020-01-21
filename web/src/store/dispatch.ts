import { saveAs } from 'file-saver';
import {
    newBuildErrorAction,
    newBuildResultAction,
    newImportFileAction,
    newLoadingAction,
    newToggleThemeAction
} from './actions';
import {State} from "./state";
import client from '../services/api';
import config from '../services/config';
import {DEMO_CODE} from '../editor/props';

type StateProvider = () => State
type DispatchFn = (Action) => any
type Dispatcher = (DispatchFn, StateProvider) => void

/////////////////////////////
//      Dispatchers        //
/////////////////////////////

export function newImportFileDispatcher(f: File): Dispatcher {
    return (dispatch: DispatchFn, _: StateProvider) => {
        const reader = new FileReader();
        reader.onload = e => {
            const data = e.target?.result as string;
            dispatch(newImportFileAction(f.name, data));
        };

        reader.onerror = e => {
            // TODO: replace with a nice modal
            alert(`Failed to import a file: ${e}`)
        };

        reader.readAsText(f, 'UTF-8');
    };
}

export function newSnippetLoadDispatcher(snippetID: string): Dispatcher {
    return async(dispatch: DispatchFn, getState: StateProvider) => {
        console.log('load snippet %s', snippetID);
        if (!snippetID) {
            dispatch(newImportFileAction('prog.go', DEMO_CODE));
            return;
        }

        try {
            const resp = await client.getSnippet(snippetID);
            const { fileName, code } = resp;
            dispatch(newImportFileAction(fileName, code));
        } catch(err) {
            dispatch(newBuildErrorAction(err.message));
        }
    }
}

export const saveFileDispatcher: Dispatcher =
    (_: DispatchFn, getState: StateProvider) => {
        try {
            const {fileName, code } = getState().editor;
            const blob = new Blob([code], {type: 'text/plain;charset=utf-8'});
            saveAs(blob, fileName);
        } catch (err) {
            // TODO: replace with a nice modal
            alert(`Failed to save a file: ${err}`)
        }
    };

export const runFileDispatcher: Dispatcher =
    async (dispatch: DispatchFn, getState: StateProvider) => {
        dispatch(newLoadingAction());
        try {
            const {code} = getState().editor;
            const res = await client.evaluateCode(code);
            dispatch(newBuildResultAction(res));
        } catch (err) {
            dispatch(newBuildErrorAction(err.message));
        }
    };

export const formatFileDispatcher: Dispatcher =
    async (dispatch: DispatchFn, getState: StateProvider) => {
        dispatch(newLoadingAction());
        try {
            const {code} = getState().editor;
            const res = await client.formatCode(code);

            if (res.formatted) {
                dispatch(newBuildResultAction(res));
            }
        } catch (err) {
            dispatch(newBuildErrorAction(err.message));
        }
    };

export const dispatchToggleTheme: Dispatcher =
    (dispatch: DispatchFn, getState: StateProvider) => {
        const { darkMode } = getState().settings;
        config.darkThemeEnabled = !darkMode;
        dispatch(newToggleThemeAction())
    };
