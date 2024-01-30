import React from 'react'
import { connect } from 'react-redux'
import { type StateDispatch, type State } from '~/store'
import { type NotificationsState, newRemoveNotificationAction } from '~/store/notifications'
import { Notification } from './Notification'
import './NotificationHost.css'

interface Props {
  notifications?: NotificationsState
  dispatch?: StateDispatch
}

const NotificationHostBase: React.FunctionComponent<Props> = ({ notifications, dispatch }) => {
  return (
    <div className="NotificationHost">
      {notifications
        ? Object.entries(notifications).map(([key, notification]) => (
            <Notification
              key={key}
              {...notification}
              onClose={() => {
                dispatch?.(newRemoveNotificationAction(key))
              }}
            />
          ))
        : null}
    </div>
  )
}

export const NotificationHost = connect<Props, any, any, State>(({ notifications }) => ({ notifications }))(
  NotificationHostBase,
)
