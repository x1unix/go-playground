import { store } from './store';


export enum ActionType {
    IMPORT_FILE = 'IMPORT_FILE',
}

type ActionTypes = keyof typeof ActionType;

export const getActionTypeKey = (k: ActionType): string => ActionType[k];

export function importFile(contents: string) {
    return {
        type: ActionType.IMPORT_FILE,
        contents
    }
}

