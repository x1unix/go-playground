import { store } from './state';
import {Action, ActionType} from './actions';

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
