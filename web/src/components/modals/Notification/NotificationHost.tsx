import React, { useCallback } from 'react'
import { type StateDispatch, connect } from '~/store'
import {
  type NotificationsState,
  newDeleteRemovedNotificationAction,
  newRemoveNotificationAction,
} from '~/store/notifications'
import { Notification } from './Notification'
import './NotificationHost.css'

interface StateProps {
  notifications?: NotificationsState
}

interface Props extends StateProps {
  dispatch: StateDispatch
}

/**
 * Component responsible for hosting and displaying notifications from store.
 */
const NotificationHostBase: React.FunctionComponent<Props> = ({ notifications, dispatch }) => {
  const dismissNotification = useCallback((id: string) => dispatch(newRemoveNotificationAction(id)), [dispatch])
  const deleteNotification = useCallback((id: string) => dispatch(newDeleteRemovedNotificationAction(id)), [dispatch])

  return (
    <div className="NotificationHost">
      {notifications
        ? Object.entries(notifications).map(([key, notification]) => (
            <Notification
              {...notification}
              key={key}
              onDismiss={dismissNotification}
              onDismissed={deleteNotification}
            />
          ))
        : null}
    </div>
  )
}

export const NotificationHost = connect<StateProps, {}>(({ notifications }) => ({ notifications }))(
  NotificationHostBase,
)
