import {Notification} from "./state";

export enum ActionType {
  NEW_NOTIFICATION = 'NEW_NOTIFICATION',
  REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION'
}

export const newAddNotificationAction = (notification: Notification) => ({
  type: ActionType.NEW_NOTIFICATION,
  payload: notification
});

export const newRemoveNotificationAction = (id: string) => ({
  type: ActionType.REMOVE_NOTIFICATION,
  payload: id,
});
