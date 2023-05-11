export enum NotificationType {
  None = '',
  Info = 'info',
  Warning = 'warning',
  Error = 'error'
}

export interface Notification {
  id: string
  type?: NotificationType
  title: string
  description?: string
  canDismiss?: boolean
  progress?: {
    indeterminate?: boolean
    total?: number
    current?: number
  }
}

export type NotificationsState = {[k: string]: Notification};
