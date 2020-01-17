import { store } from './state';
import {Action, ActionType, FileImportArgs} from './actions';

export function dispatchImportFile(fileName: string, contents: string) {
    store.dispatch<Action<FileImportArgs>>({
        type: ActionType.IMPORT_FILE,
        payload: {fileName, contents},
    });
}

export function dispatchFileChange(contents: string) {
    store.dispatch<Action<string>>({
        type: ActionType.FILE_CHANGE,
        payload: contents,
    });
}
