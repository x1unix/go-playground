import React from 'react';
import {
  IconButton,
  FontWeights,
  FontSizes,
  mergeStyleSets,
  useTheme
} from '@fluentui/react';
import { Modal } from '@fluentui/react/lib/Modal';
import { Link } from '@fluentui/react/lib/Link';

import { getContentStyles, getIconButtonStyles } from '~/styles/modal';
import config from '~/services/config';

const TITLE_ID = 'AboutTitle';
const SUB_TITLE_ID = 'AboutSubtitle';

interface AboutModalProps {
  isOpen?: boolean
  onClose: () => void
}

const modalStyles = mergeStyleSets({
  title: {
    fontWeight: FontWeights.light,
    fontSize: FontSizes.xxLargePlus,
    padding: '1em 2em 2em 2em'
  },
  footer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  }
});

export default function AboutModal(props: AboutModalProps) {
  const theme = useTheme();
  const contentStyles = getContentStyles(theme);
  const iconButtonStyles = getIconButtonStyles(theme);

  return (
    <Modal
      titleAriaId={TITLE_ID}
      subtitleAriaId={SUB_TITLE_ID}
      isOpen={props.isOpen}
      onDismiss={props.onClose}
    >
      <div className={contentStyles.header}>
        <span id={TITLE_ID}>About</span>
        <IconButton
          iconProps={{ iconName: 'Cancel' }}
          styles={iconButtonStyles}
          ariaLabel='Close popup modal'
          onClick={props.onClose as any}
        />
      </div>
      <div id={SUB_TITLE_ID} className={contentStyles.body}>
        <div className={modalStyles.title}>
          Better Go Playground
        </div>
        <div className={modalStyles.footer}>
          <Link href={config.githubUrl} target='_blank'>GitHub</Link>
          <span>Version: {config.appVersion}</span>
        </div>
      </div>
    </Modal>
  )
}

AboutModal.defaultProps = { isOpen: false };
