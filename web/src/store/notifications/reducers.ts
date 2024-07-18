import { mapByAction } from '../helpers'
import type { Action } from '../actions'
import type { Notification, NotificationsState } from './state'
import { ActionType } from './actions'

const reducers = mapByAction<NotificationsState>(
  {
    [ActionType.NEW_NOTIFICATION]: (s: NotificationsState, { payload }: Action<Notification>) => ({
      ...s,
      [payload.id]: payload,
    }),
    [ActionType.ADD_NOTIFICATIONS]: (s: NotificationsState, { payload }: Action<Notification[]>) => ({
      ...s,
      ...Object.fromEntries(payload.map((n) => [n.id, n])),
    }),
    [ActionType.REMOVE_NOTIFICATION]: (s: NotificationsState, { payload: id }: Action<string>) => {
      if (!s[id]) {
        return s
      }

      const newNotifications = { ...s }
      newNotifications[id].hidden = true
      return newNotifications
    },
    [ActionType.DESTROY_NOTIFICATION]: (s: NotificationsState, { payload: id }: Action<string>) => {
      const newNotifications = { ...s }
      delete newNotifications[id]
      return newNotifications
    },
  },
  {},
)

export default reducers
