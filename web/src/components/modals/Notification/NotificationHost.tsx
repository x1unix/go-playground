import React from 'react';
import {connect} from "react-redux";
import {StateDispatch, State} from "~/store";
import { NotificationsState, newRemoveNotificationAction } from "~/store/notifications";
import Notification from "./Notification";
import "./NotificationHost.css";


interface Props {
  notifications?: NotificationsState
  dispatch?: StateDispatch
}

const NotificationHost: React.FunctionComponent<Props> = ({notifications, dispatch}) => {
  return (
    <div className="NotificationHost">
      { notifications ? (
        Object.entries(notifications).map(([key, notification]) => (
          <Notification
            key={key}
            {...notification}
            onClose={() => dispatch!(newRemoveNotificationAction(key))}
          />
        ))
      ) : null}
    </div>
  )
};

export default connect<Props, any, any, State>(({notifications}) => ({notifications}))(
  NotificationHost
);
