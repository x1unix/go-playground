import { store } from './state';

export enum ActionType {
    IMPORT_FILE = 'IMPORT_FILE',
    FILE_CHANGE = 'FILE_CHANGE',
}

export interface Action<T = any> {
    type: ActionType
    payload: T
}

export type ActionTypes = keyof typeof ActionType;

export function dispatchImportFile(contents: string) {
    store.dispatch<Action<string>>({
        type: ActionType.IMPORT_FILE,
        payload: contents,
    });
}

export function dispatchFileChange(contents: string) {
    store.dispatch<Action<string>>({
        type: ActionType.FILE_CHANGE,
        payload: contents,
    });
}

