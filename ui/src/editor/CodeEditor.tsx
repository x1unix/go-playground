import React from 'react';
import MonacoEditor from 'react-monaco-editor';
import {editor} from 'monaco-editor';
import { Connect } from '../store/state';
import { dispatchFileChange } from '../store/actions';
// import { connect } from 'react-redux';

import { DEFAULT_EDITOR_OPTIONS, LANGUAGE_GOLANG } from './props';

interface CodeEditorState {
    code?: string
}

@Connect(s => ({code: s.code}))
export default class CodeEditor extends React.Component<CodeEditorState, CodeEditorState> {
    // constructor(props: any) {
    //     super(props);
    // }

    editorDidMount(editor: editor.IStandaloneCodeEditor, monaco: any) {
        console.log('editorDidMount', editor);
        editor.focus();
    }

    onChange(newValue: string, e: editor.IModelContentChangedEvent) {
       console.log('onChange', newValue);
        dispatchFileChange(newValue);

    }

    render() {
        return <MonacoEditor
            language={LANGUAGE_GOLANG}
            theme='vs-light'
            value={this.props.code}
            options={DEFAULT_EDITOR_OPTIONS}
            onChange={(newVal, e) => this.onChange(newVal, e)}
            editorDidMount={(e, m: any) => this.editorDidMount(e, m)}
        />;
    }
}

// export default connect(s => ({code: s.code}))(CodeEditor);
