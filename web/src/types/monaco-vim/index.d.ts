import { editor } from 'monaco-editor';

type Mode = 'visual' | 'normal' | 'insert' | 'replace';

interface StatusBar {
  setMode(mode: Mode)
  setSec(html: string, callback: () => void, options: any)
  showNotification(html: string)
  setKeyBuffer(val: string)
  setText(txt: string)
  toggleVisibility(isVisible: boolean)
  closeInput()
  clear()
}

declare module 'monaco-vim/lib/cm/keymap_vim' {
  type Callback<T> = (val: T) => void;
  export default class VimMode {
    constructor(editorInstance: editor.IStandaloneCodeEditor, statusBar?: StatusBar);
    on(eventName: 'vim-mode-change', cb: Callback<{mode: Mode, subMode?: string}>);
    on(eventName: 'vim-keypress', cb: Callback<string>);
    on(eventName: 'vim-command-done', cb: () => void);
    on(eventName: 'dispose', cb: () => void);
    setStatusBar(bar: StatusBar);
    attach();
    dispose();
  }
}

declare module 'monaco-vim' {
  export { StatusBar };
  export default function initVimMode(
    editorInstance: editor.IStandaloneCodeEditor,
    statusBarNode?: HTMLElement | null = null,
    StatusBarClass?: StatusBar,
    sanitizer?: (val: string) => string
  );
}
