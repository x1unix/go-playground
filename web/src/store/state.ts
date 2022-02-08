import { connect } from 'react-redux';
import { EvalEvent } from '../services/api';
import {MonacoSettings, RuntimeType} from '../services/config';

export interface UIState {
  shareCreated?: boolean
  snippetId?: string | null
}

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
    autoFormat: boolean,
    runtime: RuntimeType,
}

export interface State {
    editor: EditorState
    status?: StatusState,
    settings: SettingsState
    monaco: MonacoSettings
    ui?: UIState
}

export function Connect(fn: (state: State) => any) {
    return function (constructor: Function) {
        return connect(fn)(constructor as any) as any;
    }
}


