import type { Dispatcher } from '../dispatchers'
import type { DispatchFn, StateProvider } from '../helpers'
import { newAddNotificationAction, newRemoveNotificationAction } from './actions'
import type { Notification } from './state'

/**
 * Returns dispatcher that will show a notification which will disappear after a specified delay.
 */
export const dispatchNotificationWithTimeout = (notification: Notification, timeout = 5000): Dispatcher => {
  return (dispatch: DispatchFn, _: StateProvider) => {
    const { id } = notification
    setTimeout(() => dispatch(newRemoveNotificationAction(id)), timeout)
    dispatch(newAddNotificationAction(notification))
  }
}
