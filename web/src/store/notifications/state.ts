export enum NotificationType {
  None = '',
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
}

export interface NotificationAction {
  /**
   * Button label.
   */
  label: string

  /**
   * Button unique key.
   */
  key: string

  /**
   * Whether action is primary.
   */
  primary?: boolean

  /**
   * Click event handler.
   */
  onClick?: () => void
}

export interface Notification {
  /**
   * Unique notification ID.
   *
   * Used to update or delete notifications.
   */
  id: string

  /**
   * Notification severity.
   *
   * Info by default.
   */
  type?: NotificationType

  /**
   * Notification popup title.
   */
  title: string

  /**
   * Popup contents.
   */
  description?: string

  /**
   * Controls whether notification can be removed.
   *
   * By default is true.
   */
  canDismiss?: boolean

  /**
   * Whether notification was dismissed and sheduled for removal.
   *
   * Used to play notification hide animation before removing an element from state.
   */
  dismissed?: boolean

  /**
   * Progress bar information.
   */
  progress?: {
    /**
     * Identifies that current progress can't be determined but some activity is actually running.
     */
    indeterminate?: boolean

    /**
     * Total number of points to finish the operation.
     *
     * Used as a total value to calculate percentage.
     *
     * For example: total number of bytes to download.
     */
    total?: number

    /**
     * Current number of points processed.
     *
     * For example: current percentage or downloaded bytes count.
     */
    current?: number
  }

  /**
   * List of action buttons to show in a pop-up.
   */
  actions?: NotificationAction[]
}

export type NotificationsState = Record<string, Notification>
