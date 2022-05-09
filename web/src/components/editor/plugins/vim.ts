import VimModeKeymap from 'monaco-vim/lib/cm/keymap_vim';
import { editor } from 'monaco-editor';

import { Dispatch } from '~/store/vim/state';

import {
  newVimInitAction,
  newVimDisposeAction,
  newVimModeChangeAction,
  newVimKeyPressAction,
  newVimCommandDoneAction,
  VimModeChangeArgs
} from '~/store/vim/actions';

class VimModeKeymapAdapter extends VimModeKeymap {
  constructor(
    private dispatch: Dispatch,
    editorInstance: editor.IStandaloneCodeEditor
  ) {
    super(editorInstance);
  }

  attach() {
    this.dispatch(newVimInitAction());
    super.attach();
  }
}

/**
 * Creates a vim-mode adapter attached to state dispatcher and editor instance
 * @param dispatch State dispatch function
 * @param editorInstance Monaco editor instance
 */
const createVimModeAdapter = (dispatch: Dispatch, editorInstance: editor.IStandaloneCodeEditor): VimModeKeymap => {
  const vimAdapter: VimModeKeymap = new VimModeKeymapAdapter(dispatch, editorInstance);

  vimAdapter.on('vim-mode-change', (mode: VimModeChangeArgs) => {
    dispatch(newVimModeChangeAction(mode));
  });

  vimAdapter.on('vim-keypress', (key: string) => {
    dispatch(newVimKeyPressAction(key));
  });

  vimAdapter.on('vim-command-done', () => {
    dispatch(newVimCommandDoneAction());
  });

  vimAdapter.on('dispose', () => {
    dispatch(newVimDisposeAction());
  });

  return vimAdapter;
};

export default createVimModeAdapter;
