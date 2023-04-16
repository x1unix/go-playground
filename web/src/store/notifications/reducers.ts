import { mapByAction } from "../helpers";
import { Action } from "../actions";
import {Notification, NotificationsState} from "./state";
import { ActionType } from "./actions";

const reducers = mapByAction<NotificationsState>({
  [ActionType.NEW_NOTIFICATION]: (s: NotificationsState, {payload}: Action<Notification>) => (
    { ...s, [payload.id]: payload}
  ),
  [ActionType.REMOVE_NOTIFICATION]: (s: NotificationsState, {payload}: Action<string>) => {
    const newNotifications = {...s};
    delete newNotifications[payload];
    return newNotifications;
  }
}, {});

export default reducers;
