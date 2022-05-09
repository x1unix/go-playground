import VimModeKeymap from 'monaco-vim/lib/cm/keymap_vim';

export enum VimMode {
  Visual = 'visual',
  Normal = 'normal',
  Insert = 'insert'
}

export enum VimSubMode {
  Linewise = 'linewise',
  Blockwise = 'blockwise'
}

/**
 * VimModeState represents current selected mode and sub-mode.
 *
 * @see monaco-vim/lib/statusbar.js
 */
interface VimModeState {
  mode: VimMode
  subMode?: VimSubMode
}

/**
 * StatusBar is abstract status bar definition for VIM CM Adapter.
 *
 * @see monaco-vim/lib/cm_adapter.js
 */
interface StatusBar {
  setMode(mode: VimMode)
  setSec(html: string, callback: () => void, options: any)
  showNotification(html: string)
  setKeyBuffer(val: string)
  setText(txt: string)
  toggleVisibility(isVisible: boolean)
  closeInput()
  clear()
}

// const initVimMode =
