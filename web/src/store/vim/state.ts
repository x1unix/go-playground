export enum VimMode {
  Visual = 'visual',
  Normal = 'normal',
  Insert = 'insert',
  Replace = 'replace'
}

export enum VimSubMode {
  Linewise = 'linewise',
  Blockwise = 'blockwise'
}

export type Dispatch = <V=any,T=string>(v:{type: T, payload?: V}) => void;

/**
 * VimModeState represents current selected mode and sub-mode.
 *
 * @see monaco-vim/lib/statusbar.js
 */
export interface VimModeParams {
  mode: VimMode
  subMode?: VimSubMode
}

export interface VimState {
  mode: VimMode
  subMode?: VimSubMode
  keyBuffer?: string
}
