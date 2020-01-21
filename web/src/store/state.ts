import { connect } from 'react-redux';
import { EvalEvent } from '../services/api';

export interface EditorState {
    fileName: string,
    code: string
}

export interface StatusState {
    loading: boolean,
    lastError?: string | null,
    events?: EvalEvent[]
}

export interface SettingsState {
    darkMode: boolean
}

export interface State {
    editor: EditorState
    status?: StatusState,
    settings: SettingsState
}

export function Connect(fn: (state: State) => any) {
    return function (constructor: Function) {
        return connect(fn)(constructor);
    }
}


