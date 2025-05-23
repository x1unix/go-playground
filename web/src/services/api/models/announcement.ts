export interface AnnouncementMessagePart {
  type: 'link' | 'text'
  value: string
  label?: string
  style?: 'bold' | 'italic' | 'underline'
}

export interface AnnouncementMessage {
  key: string
  type: 'info' | 'error' | 'warning' | 'success'
  isIconHidden?: boolean
  isCentered?: boolean
  content: AnnouncementMessagePart[]
}

export interface AnnouncementMessageResponse {
  message: AnnouncementMessage | null
}
