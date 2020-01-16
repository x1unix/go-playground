import { editor } from "monaco-editor";

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
];

export const DEFAULT_EDITOR_OPTIONS: editor.IEditorOptions = {
    selectOnLineNumbers: true,
    mouseWheelZoom: true,
    automaticLayout: true,
    fontFamily: EDITOR_FONTS.join(', ')
};