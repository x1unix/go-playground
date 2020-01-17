import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import {editor} from 'monaco-editor';

import { DEFAULT_EDITOR_OPTIONS, DEMO_CODE, LANGUAGE_GOLANG } from './props';

interface CodeEditorState {
    code: string
}

export class CodeEditor extends React.Component<any, CodeEditorState> {
    constructor(props: any) {
        super(props);
        this.state = {
            code: DEMO_CODE
        }
    }

    editorDidMount(editor: editor.IStandaloneCodeEditor, monaco: any) {
        console.log('editorDidMount', editor);
        editor.focus();
    }

    onChange(newValue: string, e: editor.IModelContentChangedEvent) {
       // console.log('onChange', newValue, e);
    }

    render() {
        return <MonacoEditor
            language={LANGUAGE_GOLANG}
            theme='vs-light'
            value={this.state.code}
            options={DEFAULT_EDITOR_OPTIONS}
            onChange={(newVal, e) => this.onChange(newVal, e)}
            editorDidMount={(e, m: any) => this.editorDidMount(e, m)}
        />;
    }
}
