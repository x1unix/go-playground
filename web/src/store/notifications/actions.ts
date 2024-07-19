import type { Notification } from './state'

export enum ActionType {
  NEW_NOTIFICATION = 'NEW_NOTIFICATION',
  ADD_NOTIFICATIONS = 'ADD_NOTIFICATIONS',
  UPDATE_NOTIFICATION = 'UPDATE_NOTIFICATION',
  REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION',
  DELETE_REMOVED_NOTIFICATION = 'DELETE_REMOVED_NOTIFICATION',
}

/**
 * Generates a new unique notification ID.
 * @returns
 */
export const newNotificationId = () => `${Date.now().toString(36)}_${Math.random().toString(36).substring(2)}`

/**
 * Returns an action to create or update a notification by ID.
 *
 * @param notification Notification body.
 * @param updateOnly Skip if notification ID doesn't exist
 */
export const newAddNotificationAction = (notification: Notification, updateOnly = false) => ({
  type: updateOnly ? ActionType.UPDATE_NOTIFICATION : ActionType.NEW_NOTIFICATION,
  payload: notification,
})

/**
 * Returns a bulk add notifications action.
 * @param notifications List of notifications to add.
 */
export const newAddNotificationsAction = (notifications: Notification[]) => ({
  type: ActionType.ADD_NOTIFICATIONS,
  payload: notifications,
})

/**
 * Returns an action to dismiss notification.
 * @param id Notification ID
 */
export const newRemoveNotificationAction = (id: string) => ({
  type: ActionType.REMOVE_NOTIFICATION,
  payload: id,
})

/**
 * Returns an action to delete notification from store.
 *
 * Intented to use **only by notification host** responsible for drawing notifications.
 *
 * Regular clients should use `newRemoveNotificationAction` instead.
 *
 * @param id Notification ID
 */
export const newDeleteRemovedNotificationAction = (id: string) => ({
  type: ActionType.DELETE_REMOVED_NOTIFICATION,
  payload: id,
})
