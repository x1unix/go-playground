import { type Notification } from './state'

export enum ActionType {
  NEW_NOTIFICATION = 'NEW_NOTIFICATION',
  ADD_NOTIFICATIONS = 'ADD_NOTIFICATIONS',
  DESTROY_NOTIFICATION = 'DESTROY_NOTIFICATION',
  REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION',
}

/**
 * Generates a new unique notification ID.
 */
export const newNotificationId = () => `${Date.now().toString(36)}_${Math.random().toString(36).substring(2)}`

/**
 * Adds or replaces existing notification if the same ID already exists.
 */
export const newAddNotificationAction = (notification: Notification) => ({
  type: ActionType.NEW_NOTIFICATION,
  payload: notification,
})

/**
 * Upserts notifications.
 *
 * Bulk version of newAddNotificationAction.
 */
export const newAddNotificationsAction = (notifications: Notification[]) => ({
  type: ActionType.ADD_NOTIFICATIONS,
  payload: notifications,
})

/**
 * Schedules notification element for removal.
 *
 * Removes notification after animation transition end.
 *
 * @param id Notification ID.
 */
export const newRemoveNotificationAction = (id: string) => ({
  type: ActionType.REMOVE_NOTIFICATION,
  payload: id,
})

/**
 * Immediately removes notification element without showing transition.
 * Should be only used by notification host!
 *
 * Clients should use `newRemoveNotificationAction`.
 *
 * @param id Notification ID.
 */
export const newDestroyNotification = (id: string) => ({
  type: ActionType.DESTROY_NOTIFICATION,
  payload: id,
})
