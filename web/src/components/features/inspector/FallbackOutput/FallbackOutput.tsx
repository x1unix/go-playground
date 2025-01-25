import React from 'react'

import { mergeStyleSets, useTheme } from '@fluentui/react'
import type { StatusState } from '~/store'
import { OutputLine } from './OutputLine'

interface Props {
  status?: StatusState
  fontFamily: string
  fontSize: number
}

/**
 * Fallback console without terminal escape sequence emulation.
 */
export const FallbackOutput: React.FC<Props> = ({ fontFamily, fontSize, status }) => {
  const theme = useTheme()
  const styles = mergeStyleSets({
    container: {
      flex: '1 1 auto',
      boxSizing: 'border-box',
      padding: '0, 15px',
    },
    programExitMsg: {
      marginTop: '1rem',
      display: 'inline-block',
      color: theme.semanticColors.disabledText,
    },
  })

  return (
    <div className={styles.container} style={{ fontFamily, fontSize: `${fontSize}px` }}>
      {status?.events?.map((event, i) => <OutputLine key={i} event={event} />)}
      {!status?.running && <span className={styles.programExitMsg}>Program exited.</span>}
    </div>
  )
}
