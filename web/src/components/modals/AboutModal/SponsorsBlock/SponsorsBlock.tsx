import React from 'react'
import { mergeStyleSets, type IStackProps, Stack } from '@fluentui/react'
import gnolandLight from './img/gnoland-light.svg'
import gnolandDark from './img/gnoland-dark.svg'

interface Props {
  isDark?: boolean
}

const styles = mergeStyleSets({
  image: {
    width: '192px',
    maxHeight: '32px',
  },
  text: {
    fontSize: '0.75rem',
  },
})

const tokens: IStackProps['tokens'] = {
  childrenGap: '1rem',
}

export const SponsorsBlock: React.FC<Props> = ({ isDark }) => (
  <Stack horizontal tokens={tokens} verticalAlign="center">
    <Stack.Item className={styles.image}>
      <a href="https://gno.land/?from=goplay-tools" target="_blank" rel="noreferrer">
        <img src={isDark ? gnolandDark : gnolandLight} alt="gno.land" />
      </a>
    </Stack.Item>
    <Stack.Item className={styles.text}>
      gno.land, an open-source smart contract platform powered by Gno, a deterministic variant of Go.
    </Stack.Item>
  </Stack>
)
