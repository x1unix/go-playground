import React from 'react'
import { mergeStyles } from '@fluentui/react'
import gnolandLight from './img/gnoland-light.svg'
import gnolandDark from './img/gnoland-dark.svg'

interface Props {
  isDark?: boolean
}

const imgStyles = mergeStyles({
  maxWidth: '100%',
  maxHeight: '32px',
})

export const SponsorsBlock: React.FC<Props> = ({ isDark }) => (
  <div>
    <a href="https://gno.land/?from=goplay-tools" target="_blank" rel="noreferrer">
      <img className={imgStyles} src={isDark ? gnolandDark : gnolandLight} alt="gno.land" />
    </a>
  </div>
)
