import { type editor } from 'monaco-editor'

type Mode = 'visual' | 'normal' | 'insert' | 'replace'

interface StatusBar {
  setMode: (mode: Mode) => any
  setSec: (html: string, callback: () => void, options: any) => any
  showNotification: (html: string) => any
  setKeyBuffer: (val: string) => any
  setText: (txt: string) => any
  toggleVisibility: (isVisible: boolean) => any
  closeInput: () => any
  clear: () => any
}

declare module 'monaco-vim/lib/cm/keymap_vim' {
  type Callback<T> = (val: T) => void
  export default class VimMode {
    constructor(editorInstance: editor.IStandaloneCodeEditor, statusBar?: StatusBar)
    on(eventName: 'vim-mode-change', cb: Callback<{ mode: Mode; subMode?: string }>)
    on(eventName: 'vim-keypress', cb: Callback<string>)
    on(eventName: 'vim-command-done', cb: () => void)
    on(eventName: 'dispose', cb: () => void)
    setStatusBar(bar: StatusBar)
    attach()
    dispose()
  }
}

declare module 'monaco-vim' {
  export type { StatusBar }
  export default function initVimMode(
    editorInstance: editor.IStandaloneCodeEditor,
    statusBarNode?: HTMLElement | null = null,
    StatusBarClass?: StatusBar,
    sanitizer?: (val: string) => string,
  )
}
