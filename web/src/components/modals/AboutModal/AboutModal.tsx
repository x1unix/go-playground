import React, { useMemo } from 'react'
import {
  MotionAnimations,
  MotionDurations,
  IconButton,
  FontWeights,
  FontSizes,
  mergeStyleSets,
  useTheme,
} from '@fluentui/react'
import { Modal } from '@fluentui/react/lib/Modal'
import { Link } from '@fluentui/react/lib/Link'

import { ChangeLog } from './ChangeLog'
import { getContentStyles, getIconButtonStyles } from '~/styles/modal'
import environment from '~/environment'
import { SponsorsBlock } from './SponsorsBlock'
import { FooterButtons } from './FooterButtons'

const TITLE_ID = 'AboutTitle'

interface AboutModalProps {
  isOpen?: boolean
  onClose: () => void
}

export const AboutModal: React.FC<AboutModalProps> = (props: AboutModalProps) => {
  const theme = useTheme()
  const contentStyles = getContentStyles(theme)
  const iconButtonStyles = getIconButtonStyles(theme)

  const modalStyles = useMemo(
    () =>
      mergeStyleSets({
        container: {
          animation: MotionAnimations.slideDownIn,
          animationDuration: MotionDurations.duration3,
        },
        main: {
          maxWidth: '440px',
        },
        title: {
          fontWeight: FontWeights.semibold,
          fontSize: FontSizes.xxLargePlus,
          padding: '1em 0 2em',
          color: 'transparent',
          background:
            'linear-gradient(to right, rgb(10,97,244) 0%, rgb(16, 187, 187) 100%) repeat scroll 0% 0% / auto padding-box text',
          textAlign: 'center',
        },
        info: {
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        },
        footer: {
          marginTop: '2em',
          backgroundColor: theme.semanticColors.bodyStandoutBackground,
          padding: '.3rem 24px 24px',
          margin: '24px -24px -24px',
        },
      }),
    [theme],
  )

  return (
    <Modal
      titleAriaId={TITLE_ID}
      isOpen={props.isOpen}
      onDismiss={props.onClose}
      styles={modalStyles}
      containerClassName={modalStyles.container}
    >
      <div className={contentStyles.header}>
        <IconButton
          iconProps={{ iconName: 'Cancel' }}
          styles={iconButtonStyles}
          ariaLabel="Close popup modal"
          onClick={props.onClose as any}
        />
      </div>
      <div className={contentStyles.body}>
        <div id={TITLE_ID} className={modalStyles.title}>
          Better Go Playground
        </div>
        <div className={modalStyles.info}>
          <Link href={environment.urls.github} target="_blank">
            <b>GitHub</b>
          </Link>
          <span>Version: {environment.appVersion}</span>
        </div>
        <div className={modalStyles.footer}>
          <div>
            <h3>What&apos;s New</h3>
            <ChangeLog />
          </div>
          <div>
            <h3>Sponsors</h3>
            <SponsorsBlock isDark={theme.isInverted} />
          </div>
          <FooterButtons />
        </div>
      </div>
    </Modal>
  )
}

AboutModal.defaultProps = { isOpen: false }
