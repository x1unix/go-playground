import * as monaco from 'monaco-editor';
import {MonacoSettings} from "../services/config";

export const LANGUAGE_GOLANG = 'go';

export const DEMO_CODE = [
    'package main\n',
    'import "fmt"\n',
    'func main() {',
    '\tfmt.Println("Hello World")',
    '}\n'
].join('\n');

export const EDITOR_FONTS = [
    'Fira Code',
    'Menlo',
    'Monaco',
    'Consolas',
    'Lucida Console',
    'Roboto Mono',
    'Droid Sans',
    'Courier New',
    'monospace'
].join(', ');

// stateToOptions converts MonacoState to IEditorOptions
export const stateToOptions = (state: MonacoSettings): monaco.editor.IEditorOptions => {
    const {selectOnLineNumbers, mouseWheelZoom, smoothScrolling, cursorBlinking, cursorStyle, contextMenu } = state;
    return {
        selectOnLineNumbers, mouseWheelZoom, smoothScrolling, cursorBlinking, cursorStyle,
        fontFamily: EDITOR_FONTS,
        showUnused: true,
        automaticLayout: true,
        minimap: {enabled: state.minimap},
        contextmenu: contextMenu,
    };
};