import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import {editor} from 'monaco-editor';
import { Connect } from '../store/state';
import { dispatchFileChange } from '../store';
// import { connect } from 'react-redux';

import { DEFAULT_EDITOR_OPTIONS, LANGUAGE_GOLANG } from './props';

interface CodeEditorState {
    code?: string
}

@Connect(s => ({code: s.code, darkMode: s.darkMode}))
export default class CodeEditor extends React.Component<{code?: string, darkMode?: boolean}, CodeEditorState> {
    editorDidMount(editor: editor.IStandaloneCodeEditor, monaco: any) {
        editor.focus();
    }

    onChange(newValue: string, e: editor.IModelContentChangedEvent) {
        dispatchFileChange(newValue);
    }

    render() {
        return <MonacoEditor
            language={LANGUAGE_GOLANG}
            theme={this.props.darkMode ? 'vs-dark' : 'vs-light'}
            value={this.props.code}
            options={DEFAULT_EDITOR_OPTIONS}
            onChange={(newVal, e) => this.onChange(newVal, e)}
            editorDidMount={(e, m: any) => this.editorDidMount(e, m)}
        />;
    }
}
