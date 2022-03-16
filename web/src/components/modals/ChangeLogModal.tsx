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
        <b>Runtime - WebAssembly</b>
        <ul>
          <li>
            <Link
              className='ChangeLogModal__issue-url'
              href='https://github.com/x1unix/go-playground/pull/129'
              target='_blank'
            >
              #129
            </Link>
            <span>Use Go 1.18</span>
          </li>
        </ul>
        <p>
          And more!
        </p>
        <p>
          Full release notes are available <Link href={`${config.githubUrl}/releases/latest`} target='_blank'>here</Link>
        </p>
      </div>
    </Modal>
  )
}

ChangeLogModal.defaultProps = { isOpen: false };
