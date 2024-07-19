import { type Notification } from './state'

export enum ActionType {
  NEW_NOTIFICATION = 'NEW_NOTIFICATION',
  ADD_NOTIFICATIONS = 'ADD_NOTIFICATIONS',
  UPDATE_NOTIFICATION = 'UPDATE_NOTIFICATION',
  REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION',
}

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

export const newAddNotificationsAction = (notifications: Notification[]) => ({
  type: ActionType.ADD_NOTIFICATIONS,
  payload: notifications,
})

export const newRemoveNotificationAction = (id: string) => ({
  type: ActionType.REMOVE_NOTIFICATION,
  payload: id,
})
