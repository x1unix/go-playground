import * as monaco from 'monaco-editor';
import {MonacoSettings} from '../services/config';
import { getFontFamily, getDefaultFontFamily } from '../services/fonts';

export const LANGUAGE_GOLANG = 'go';

export const DEMO_CODE = [
    'package main\n',
    'import (',
    '\t"fmt"',
    ')\n',
    'func main() {',
    '\tfmt.Println("Hello World")',
    '}\n'
].join('\n');

// stateToOptions converts MonacoState to IEditorOptions
export const stateToOptions = (state: MonacoSettings): monaco.editor.IEditorOptions => {
    const {
        selectOnLineNumbers,
        mouseWheelZoom,
        smoothScrolling,
        cursorBlinking,
        fontLigatures,
        cursorStyle,
        contextMenu
    } = state;
    return {
        selectOnLineNumbers, mouseWheelZoom, smoothScrolling, cursorBlinking, cursorStyle, fontLigatures,
        fontFamily: state.fontFamily ? getFontFamily(state.fontFamily) : getDefaultFontFamily(),
        showUnused: true,
        automaticLayout: true,
        minimap: {enabled: state.minimap},
        contextmenu: contextMenu,
    };
};
