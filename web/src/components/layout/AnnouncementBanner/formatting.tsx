import React from 'react'
import { Link, MessageBarType } from '@fluentui/react'
import type { AnnouncementMessage, AnnouncementMessagePart } from '~/services/api'

const announcementToMessageType: Record<AnnouncementMessage['type'], MessageBarType> = {
  info: MessageBarType.info,
  error: MessageBarType.error,
  warning: MessageBarType.warning,
  success: MessageBarType.success,
}

export const getMessageBarType = (msgType: AnnouncementMessage['type']) =>
  announcementToMessageType[msgType] ?? MessageBarType.info

const formatText = (style: AnnouncementMessagePart['style'], content: string) => {
  if (!style) {
    return content
  }

  switch (style) {
    case 'bold':
      return <b>{content}</b>
    case 'italic':
      return <i>{content}</i>
    case 'underline':
      return <u>{content}</u>
    default:
      return content
  }
}

const msgChunkToNode = (chunk: AnnouncementMessagePart, i: number) => {
  switch (chunk.type) {
    case 'link':
      return (
        <Link key={i} href={chunk.value} target="_blank" rel="noopener noreferer" underline>
          {formatText(chunk.style, chunk.label ?? chunk.value)} ↗︎
        </Link>
      )
    default:
      return <span key={i}>{formatText(chunk.style, chunk.value)}</span>
  }
}

export const messagePartsToNode = (parts: AnnouncementMessagePart[]) => parts.map(msgChunkToNode)
