import React from 'react'

import { Stack, DefaultButton, mergeStyleSets } from '@fluentui/react'

import environment from '~/environment'

const styles = mergeStyleSets({
  root: {
    marginTop: '1.5rem',
  },
  inner: {
    '@media (max-width: 480px)': {
      flexDirection: 'column',
    },
  },
  button: {
    display: 'block',
  },
})

export const FooterButtons: React.FC = () => (
  <Stack
    horizontal
    wrap
    grow={1}
    styles={styles}
    horizontalAlign="space-evenly"
    tokens={{
      childrenGap: 'm',
    }}
  >
    <Stack.Item grow={1}>
      <DefaultButton
        className={styles.button}
        href={environment.urls.issue}
        target="_blank"
        iconProps={{
          iconName: 'Bug',
        }}
      >
        Report Bug
      </DefaultButton>
    </Stack.Item>
    <Stack.Item grow={1}>
      <DefaultButton
        className={styles.button}
        href={environment.urls.github}
        target="_blank"
        iconProps={{
          iconName: 'VscGithubInverted',
        }}
      >
        Source
      </DefaultButton>
    </Stack.Item>

    <Stack.Item grow={1}>
      <DefaultButton
        className={styles.button}
        href={environment.urls.donate}
        target="_blank"
        iconProps={{
          iconName: 'Heart',
        }}
      >
        Donate
      </DefaultButton>
    </Stack.Item>
  </Stack>
)
