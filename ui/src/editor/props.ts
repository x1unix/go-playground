import * as monaco from 'monaco-editor';

export const LANGUAGE_GOLANG = 'go';

export const DEMO_CODE = [
    'package main\n',
    'import "fmt"\n',
    'func main() {',
    '\tfmt.Println("Hello World");',
    '}\n'
].join('\n');

const EDITOR_FONTS = [
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

export const DEFAULT_EDITOR_OPTIONS: monaco.editor.IEditorOptions = {
    selectOnLineNumbers: true,
    mouseWheelZoom: true,
    automaticLayout: true,
    fontFamily: EDITOR_FONTS,
    showUnused: true
};