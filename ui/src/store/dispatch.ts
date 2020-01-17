import {store} from './state';
import {CompilerResponse} from '../services/api';
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

export function dispatchBuildResult(resp: CompilerResponse) {
    store.dispatch<Action<CompilerResponse>>({
        type: ActionType.COMPILE_RESULT,
        payload: resp,
    })
}

export function dispatchBuildError(err: string) {
    store.dispatch<Action<string>>({
        type: ActionType.COMPILE_FAIL,
        payload: err,
    })
}
