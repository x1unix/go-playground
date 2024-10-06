import type * as monaco from 'monaco-editor'
import { type MonacoSettings } from '~/services/config'
import { getFontFamily, getDefaultFontFamily } from '~/services/fonts'

export const languageFromFilename = (fname: string) => (fname.endsWith('.mod') ? 'gomod' : 'go')

// stateToOptions converts MonacoState to IEditorOptions
export const stateToOptions = (state: MonacoSettings): monaco.editor.IEditorOptions => {
  // fontSize here is intentionally ignored as monaco-editor starts to infinitly change
  // font size to random values for unknown reason.
  //
  // Font size apply moved to componentDidMount.
  const {
    selectOnLineNumbers,
    mouseWheelZoom,
    smoothScrolling,
    cursorBlinking,
    fontLigatures,
    cursorStyle,
    contextMenu,
  } = state
  return {
    selectOnLineNumbers,
    mouseWheelZoom,
    smoothScrolling,
    cursorBlinking,
    cursorStyle,
    fontLigatures,
    fontFamily: state.fontFamily ? getFontFamily(state.fontFamily) : getDefaultFontFamily(),
    showUnused: true,
    automaticLayout: true,
    minimap: { enabled: state.minimap },
    fixedOverflowWidgets: true,
    contextmenu: contextMenu,
  }
}
