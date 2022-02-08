import React from 'react';
import { getTheme, IconButton } from '@fluentui/react';
import { Modal } from '@fluentui/react/lib/Modal';
import { Link } from '@fluentui/react/lib/Link';

import { getContentStyles, getIconButtonStyles } from '~/styles/modal';
import config from '~/services/config';

import './ChangeLogModal.css';

const TITLE_ID = 'ChangeLogTitle';
const SUB_TITLE_ID = 'ChangeLogSubtitle';

interface ChangeLogModalProps {
  isOpen?: boolean
  onClose: () => void
}

export default function ChangeLogModal(props: ChangeLogModalProps) {
  const theme = getTheme();
  const contentStyles = getContentStyles(theme);
  const iconButtonStyles = getIconButtonStyles(theme);

  return (
    <Modal
      titleAriaId={TITLE_ID}
      subtitleAriaId={SUB_TITLE_ID}
      isOpen={props.isOpen}
      onDismiss={props.onClose}
      containerClassName={contentStyles.container}
    >
      <div className={contentStyles.header}>
        <span id={TITLE_ID}>Changelog for {config.appVersion}</span>
        <IconButton
          iconProps={{ iconName: 'Cancel' }}
          styles={iconButtonStyles}
          ariaLabel='Close popup modal'
          onClick={props.onClose as any}
        />
      </div>
      <div id={SUB_TITLE_ID} className={contentStyles.body}>
        <b>Interface - Editor</b>
        <ul>
          <li>
            <Link
              className='ChangeLogModal__issue-url'
              href='https://github.com/x1unix/go-playground/issues/81'
              target='_blank'
            >
              #81
            </Link>
            <span>Add resizable application output</span>
          </li>
          <li>
            <Link
              className='ChangeLogModal__issue-url'
              href='https://github.com/x1unix/go-playground/issues/60'
              target='_blank'
            >
              #60
            </Link>
            <span>Add clear command</span>
          </li>
          <li>
            <Link
              className='ChangeLogModal__issue-url'
              href='https://github.com/x1unix/go-playground/issues/6'
              target='_blank'
            >
              #6
            </Link>
            <span>Add share snippet notification</span>
          </li>
          <li> Hide text in <i>What's new</i> button to save space on mobile devices.</li>
          <li>Add PWA support.</li>
        </ul>
        <b>Compiler - WebAssembly</b>
        <ul>
          <li>Update SDK to Go 1.17.6</li>
        </ul>
        <p>
          And more!
        </p>
        <p>
          Full release notes for are available <Link href={`${config.githubUrl}/releases/latest`} target='_blank'>here</Link>
        </p>
      </div>
    </Modal>
  )
}

ChangeLogModal.defaultProps = { isOpen: false };
