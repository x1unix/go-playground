import React from 'react'

import { mergeStyleSets } from '@fluentui/react'
import type { EvalEvent } from '~/services/api'

const imageSectionPrefix = 'IMAGE:'
const base64RegEx = /^[A-Za-z0-9+/]+={0,2}$/

const isImageLine = (message: string) => {
  if (!message?.startsWith(imageSectionPrefix)) {
    return [false, null]
  }

  const payload = message.substring(imageSectionPrefix.length).trim()
  return [base64RegEx.test(payload), payload]
}

const styles = mergeStyleSets({
  container: {
    display: 'table',
    width: '100%',
    '&[data-event-kind="stderr"]': {
      color: '#e22',
    },
  },
  delay: {
    color: '#666',
    marginRight: '5px',
    float: 'right',
  },
  message: {
    font: 'inherit',
    border: 'none',
    margin: 0,
    float: 'left',
    whiteSpace: 'pre-wrap',
  },
})

interface Props {
  event: EvalEvent
}

export const OutputLine: React.FC<Props> = ({ event }) => {
  const [isImage, payload] = isImageLine(event.Message)

  return (
    <div className={styles.container} data-event-kind={event.Kind}>
      {isImage ? (
        <img src={`data:image;base64,${payload}`} alt="Image output" />
      ) : (
        <pre className={styles.message}>{event.Message}</pre>
      )}
    </div>
  )
}
