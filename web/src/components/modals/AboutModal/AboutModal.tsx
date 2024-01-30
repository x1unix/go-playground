import React, { useMemo } from 'react'
import { IconButton, FontWeights, FontSizes, mergeStyleSets, useTheme, Stack, DefaultButton } from '@fluentui/react'
import { Modal } from '@fluentui/react/lib/Modal'
import { Link } from '@fluentui/react/lib/Link'

import { ChangeLog } from './ChangeLog'
import { getContentStyles, getIconButtonStyles } from '~/styles/modal'
import environment from '~/environment'

const TITLE_ID = 'AboutTitle'
const SUB_TITLE_ID = 'AboutSubtitle'

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
        main: {
          maxWidth: '640px',
        },
        title: {
          fontWeight: FontWeights.light,
          fontSize: FontSizes.xxLargePlus,
          padding: '1em 2em 2em 2em',
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
      subtitleAriaId={SUB_TITLE_ID}
      isOpen={props.isOpen}
      onDismiss={props.onClose}
      styles={modalStyles}
    >
      <div className={contentStyles.header}>
        <span id={TITLE_ID}>About</span>
        <IconButton
          iconProps={{ iconName: 'Cancel' }}
          styles={iconButtonStyles}
          ariaLabel="Close popup modal"
          onClick={props.onClose as any}
        />
      </div>
      <div id={SUB_TITLE_ID} className={contentStyles.body}>
        <div className={modalStyles.title}>Better Go Playground</div>
        <div className={modalStyles.info}>
          <Link href={environment.urls.github} target="_blank">
            <b>GitHub</b>
          </Link>
          <span>Version: {environment.appVersion}</span>
        </div>
        <div className={modalStyles.footer}>
          <div>
            <h3>What's New</h3>
            <ChangeLog />
          </div>
          <Stack
            horizontal
            wrap
            horizontalAlign="end"
            tokens={{
              childrenGap: 'm',
            }}
            style={{
              marginTop: '1.5rem',
            }}
          >
            <Stack.Item grow={1}>
              <DefaultButton
                href={environment.urls.issue}
                target="_blank"
                iconProps={{
                  iconName: 'Bug',
                }}
              >
                Report Bug
              </DefaultButton>
            </Stack.Item>
            <DefaultButton
              href={environment.urls.github}
              target="_blank"
              iconProps={{
                iconName: 'OpenSource',
              }}
            >
              Source
            </DefaultButton>

            <DefaultButton
              href={environment.urls.donate}
              target="_blank"
              iconProps={{
                iconName: 'Heart',
              }}
            >
              Donate
            </DefaultButton>
          </Stack>
        </div>
      </div>
    </Modal>
  )
}

AboutModal.defaultProps = { isOpen: false }
