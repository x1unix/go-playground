import {Notification} from "./state";

export enum ActionType {
  NEW_NOTIFICATION = 'NEW_NOTIFICATION',
  ADD_NOTIFICATIONS = 'ADD_NOTIFICATIONS',
  REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION'
}

export const newNotificationId = () => `${Date.now().toString(36)}_${Math.random().toString(36).substring(2)}`;

export const newAddNotificationAction = (notification: Notification) => ({
  type: ActionType.NEW_NOTIFICATION,
  payload: notification
});

export const newAddNotificationsAction = (notifications: Notification[]) => ({
  type: ActionType.ADD_NOTIFICATIONS,
  payload: notifications
});

export const newRemoveNotificationAction = (id: string) => ({
  type: ActionType.REMOVE_NOTIFICATION,
  payload: id,
});
