import React from 'react';
import { connect } from 'react-redux';
import { SiVim } from 'react-icons/si';
import { State } from '~/store';
import { Nullable } from '~/utils/types';
import { VimMode, VimState, VimSubMode } from '~/store/vim/state';
import StatusBarItem from '~/components/core/StatusBar/StatusBarItem';

interface Props {
  vimState?: Nullable<VimState>
}

const getItemText = (state: Nullable<VimState>): Nullable<string> => {
  if (!state) return null;
  const { mode, subMode, keyBuffer, commandStarted, confirmMessage } = state;
  if (confirmMessage) {
    return confirmMessage;
  }

  if (commandStarted) {
    return keyBuffer!;
  }

  if (mode !== VimMode.Visual) {
    return `-- ${mode.toUpperCase()} --`;
  }

  switch (subMode) {
    case VimSubMode.Linewise:
      return '-- VISUAL LINE --';
    case VimSubMode.Blockwise:
      return '-- VISUAL BLOCK --';
    default:
      return '-- VISUAL --';
  }
}

const VimStatusBarItem: React.FC<Props> = ({vimState}) => {
  if (!vimState) {
    return null;
  }

  return (
    <StatusBarItem
      title="Vim Status"
      icon={SiVim}
    >
      {getItemText(vimState)}
    </StatusBarItem>
  )
}

export default connect(
  ({vim}: State) => ({ vimState: vim})
)(VimStatusBarItem);
