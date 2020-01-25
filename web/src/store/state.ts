import { connect } from 'react-redux';
import { EvalEvent } from '../services/api';

export enum RuntimeType {
    GoPlayground = 'GO_PLAYGROUND',
    WebAssembly = 'WASM'
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

export interface MonacoState {
    cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid',
    cursorStyle: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin',
    selectOnLineNumbers: boolean,
    minimap: boolean,
    contextMenu: boolean,
    smoothScrolling: boolean,
    mouseWheelZoom: boolean,
}

export interface State {
    editor: EditorState
    status?: StatusState,
    settings: SettingsState
    monaco: MonacoState
}

export function Connect(fn: (state: State) => any) {
    return function (constructor: Function) {
        return connect(fn)(constructor);
    }
}


