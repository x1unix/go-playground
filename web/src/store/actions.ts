import {CompilerResponse} from "../services/api";

export enum ActionType {
    IMPORT_FILE     = 'IMPORT_FILE',
    FILE_CHANGE     = 'FILE_CHANGE',
    LOADING         = 'LOADING',
    ERROR           = 'ERROR',
    COMPILE_RESULT  = 'COMPILE_RESULT',
    TOGGLE_THEME    = 'TOGGLE_THEME'
}

export interface Action<T = any> {
    type: ActionType
    payload: T
}

export interface FileImportArgs {
    fileName: string
    contents: string
}

export const newImportFileAction = (fileName: string, contents: string) =>
    ({
        type: ActionType.IMPORT_FILE,
        payload: {fileName, contents},
    });

export const newFileChangeAction = (contents: string) =>
    ({
        type: ActionType.FILE_CHANGE,
        payload: contents,
    });

export const newBuildResultAction = (resp: CompilerResponse) =>
    ({
        type: ActionType.COMPILE_RESULT,
        payload: resp,
    });

export const newErrorAction = (err: string) =>
    ({
        type: ActionType.ERROR,
        payload: err,
    });

export const newToggleThemeAction = () =>
    ({
        type: ActionType.TOGGLE_THEME,
        payload: null,
    });

export const newLoadingAction = () =>
    ({
        type: ActionType.LOADING,
        payload: null,
    });


