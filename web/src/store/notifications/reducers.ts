import { mapByAction } from '../helpers'
import { type Action } from '../actions'
import { type Notification, type NotificationsState } from './state'
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
    [ActionType.UPDATE_NOTIFICATION]: (s: NotificationsState, { payload }: Action<Notification>) => {
      if (!s[payload.id]) {
        return s
      }

      return { ...s, [payload.id]: payload }
    },
    [ActionType.REMOVE_NOTIFICATION]: (s: NotificationsState, { payload }: Action<string>) => {
      const newNotifications = { ...s }
      delete newNotifications[payload]
      return newNotifications
    },
  },
  {},
)

export default reducers
