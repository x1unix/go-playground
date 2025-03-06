import React from 'react'

import { mergeStyleSets, useTheme } from '@fluentui/react'
import type { StatusState } from '~/store'
import { EvalEventKind } from '~/services/api'
import { splitImageAndText } from './utils'

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
    root: {
      flex: '1 1 auto',
      boxSizing: 'border-box',
      padding: '0, 15px',
    },
    content: {
      whiteSpace: 'pre-wrap',
      display: 'table',
      width: '100%',

      font: 'inherit',
      border: 'none',
      margin: 0,
      float: 'left',
    },
    stderr: {
      color: theme.palette.red,
    },
    image: {
      display: 'block',
    },
    programExitMsg: {
      marginTop: '1rem',
      display: 'inline-block',
      color: theme.semanticColors.disabledText,
    },
  })

  return (
    <div className={styles.root} style={{ fontFamily, fontSize: `${fontSize}px` }}>
      <div className={styles.content}>
        {status?.events?.map(({ Kind: kind, Message: msg }, i) => {
          if (kind === EvalEventKind.Stderr) {
            return (
              <span key={i} className={styles.stderr}>
                {msg}
              </span>
            )
          }

          // Image content and text can come mixed due to output buffering
          return splitImageAndText(msg).map(({ isImage, data }, j) => (
            <React.Fragment key={`${i}.${j}`}>
              {isImage ? (
                <img className={styles.image} key={i} src={`data:image;base64,${data}`} alt="Image output" />
              ) : (
                data
              )}
            </React.Fragment>
          ))
        })}
      </div>
      {!status?.running && <span className={styles.programExitMsg}>Program exited.</span>}
    </div>
  )
}
