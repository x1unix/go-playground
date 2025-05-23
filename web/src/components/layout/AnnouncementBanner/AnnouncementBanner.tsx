import React, { useState, useEffect } from 'react'
import { MessageBar, mergeStyleSets } from '@fluentui/react'
import type { AnnouncementMessage } from '~/services/api'
import announcementService from '~/services/announcements'
import { getMessageBarType, messagePartsToNode } from './formatting'

const barCenteredTextStyle = {
  root: {
    textAlign: 'center',
  },
  innerText: {
    width: '100%',
  },
}

const barNoIconStyle = {
  icon: {
    display: 'none',
  },
}

const barInfoStyle = {
  text: {
    a: {
      color: 'inherit !important',
    },
  },
}

export const AnnouncementBanner: React.FC = () => {
  const [message, setMessage] = useState<AnnouncementMessage | null>(null)
  useEffect(() => {
    void announcementService.getAnnouncement().then(setMessage)
  }, [])

  if (!message) {
    return null
  }

  const messageBarStyles = mergeStyleSets(
    message.isCentered && barCenteredTextStyle,
    message.isIconHidden && barNoIconStyle,
    message.type === 'info' && barInfoStyle,
  )

  return (
    <MessageBar
      messageBarType={getMessageBarType(message.type)}
      dismissButtonAriaLabel="Close"
      styles={messageBarStyles}
      onDismiss={() => {
        announcementService.dismissAnnouncement(message.key)
        setMessage(null)
      }}
    >
      {messagePartsToNode(message.content)}
    </MessageBar>
  )
}
