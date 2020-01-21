import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import {editor} from 'monaco-editor';
import { Connect, newFileChangeAction } from '../store';
// import { connect } from 'react-redux';

import { DEFAULT_EDITOR_OPTIONS, LANGUAGE_GOLANG } from './props';

interface CodeEditorState {
    code?: string
    loading?:boolean
}

@Connect(s => ({code: s.editor.code, darkMode: s.settings.darkMode, loading: s.status?.loading}))
export default class CodeEditor extends React.Component<any, CodeEditorState> {
    editorDidMount(editor: editor.IStandaloneCodeEditor, monaco: any) {
        editor.focus();
    }

    onChange(newValue: string, e: editor.IModelContentChangedEvent) {
        this.props.dispatch(newFileChangeAction(newValue));
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
