import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import {editor, default as monaco, MarkerSeverity} from 'monaco-editor';
import {Connect, newFileChangeAction} from '../store';

import { LANGUAGE_GOLANG, stateToOptions } from './props';

interface CodeEditorState {
    code?: string
    loading?:boolean
}

@Connect(s => ({
    code: s.editor.code,
    darkMode: s.settings.darkMode,
    loading: s.status?.loading,
    options: s.monaco,
}))
export default class CodeEditor extends React.Component<any, CodeEditorState> {
    editorDidMount(editorInstance: editor.IStandaloneCodeEditor, _: monaco.editor.IEditorConstructionOptions) {
        editor.setModelMarkers(editorInstance.getModel() as editor.ITextModel, "owner", [
            {
                startLineNumber: 3,
                startColumn: 18,
                endLineNumber: 3,
                endColumn: 23,
                message: 'Error!',
                severity: 8
            }
        ]);
        editorInstance.focus();
    }

    onChange(newValue: string, e: editor.IModelContentChangedEvent) {
        this.props.dispatch(newFileChangeAction(newValue));
    }

    render() {
        const options = stateToOptions(this.props.options);
        return <MonacoEditor
            language={LANGUAGE_GOLANG}
            theme={this.props.darkMode ? 'vs-dark' : 'vs-light'}
            value={this.props.code}
            options={options}
            onChange={(newVal, e) => this.onChange(newVal, e)}
            editorDidMount={(e, m: any) => this.editorDidMount(e, m)}
        />;
    }
}
