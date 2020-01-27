import {CompilerResponse, EvalEvent} from "../services/api";
import {MonacoSettings, RuntimeType} from "../services/config";

export enum ActionType {
    IMPORT_FILE             = 'IMPORT_FILE',
    FILE_CHANGE             = 'FILE_CHANGE',
    LOADING                 = 'LOADING',
    ERROR                   = 'ERROR',
    COMPILE_RESULT          = 'COMPILE_RESULT',
    TOGGLE_THEME            = 'TOGGLE_THEME',
    BUILD_PARAMS_CHANGE     = 'BUILD_PARAMS_CHANGE',
    MONACO_SETTINGS_CHANGE  = 'MONACO_SETTINGS_CHANGE',

    // Special actions used by Go WASM bridge
    EVAL_START      = 'EVAL_START',
    EVAL_EVENT      = 'EVAL_EVENT',
    EVAL_FINISH     = 'EVAL_FINISH'
}

export interface Action<T = any> {
    type: ActionType
    payload: T
}

export interface FileImportArgs {
    fileName: string
    contents: string
}

export interface BuildParamsArgs {
    runtime: RuntimeType
    autoFormat: boolean
}

export type MonacoParamsChanges<T = any> = {
    [k in keyof MonacoSettings | string]: T;
};

export const actionOf = (type: ActionType) => ({type});

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

export const newBuildParamsChangeAction = (runtime: RuntimeType, autoFormat: boolean) =>
    ({
        type: ActionType.BUILD_PARAMS_CHANGE,
        payload: {runtime, autoFormat} as BuildParamsArgs
    });

export const newMonacoParamsChangeAction = <T>(changes: MonacoParamsChanges<T>) =>
    ({
        type: ActionType.MONACO_SETTINGS_CHANGE,
        payload: changes
    });

export const newProgramWriteAction = (event: EvalEvent) =>
    ({
        type: ActionType.EVAL_EVENT,
        payload: event
    });