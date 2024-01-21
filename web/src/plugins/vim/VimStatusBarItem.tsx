import React from 'react';
import clsx from 'clsx';
import { connect } from 'react-redux';
import { SiVim } from 'react-icons/si';
import { State } from '~/store';
import { Nullable } from '~/utils/types';
import { VimMode, VimState, VimSubMode } from '~/store/vim/state';
import { StatusBarItem } from '~/components/layout/StatusBar/StatusBarItem';
import './VimStatusBarItem.css'


interface Props {
  vimState?: Nullable<VimState>
}

const getItemText = (state: Nullable<VimState>): Nullable<string> => {
  if (!state) return null;
  const { mode, subMode, keyBuffer, commandStarted, confirmMessage } = state;
  if (confirmMessage) {
    return confirmMessage.message;
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

const VimStatusBarItemBase: React.FC<Props> = ({vimState}) => {
  if (!vimState) {
    return null;
  }

  const isError = vimState?.confirmMessage?.type === 'error';
  return (
    <StatusBarItem
      title="Vim Status"
      icon={SiVim}
      className={clsx({
        'VimStatusBarItem--error': isError
      })}
    >
      {getItemText(vimState)}
    </StatusBarItem>
  )
}

export const VimStatusBarItem = connect(
  ({vim}: State) => ({ vimState: vim})
)(VimStatusBarItemBase);
