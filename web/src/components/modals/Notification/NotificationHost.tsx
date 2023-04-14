import React from 'react';
import Notification, {NotificationType} from "./Notification";
import "./NotificationHost.css";

const NotificationHost = () => {
  return (
    <div className="NotificationHost">
      <Notification
        title="Empty"
      />
      <Notification
        title="Success"
        description="All packages installed successfully"
      />
      <Notification
        title="Initializing..."
        progress={{
          indeterminate: true
        }}
      />
      <Notification
        title="Installing dependencies..."
        description="Downloading golang.org/x/tools/syscall"
        progress={{
          indeterminate: true
        }}
      />
      <Notification
        type={NotificationType.Warning}
        title="Incomplete state"
        description="Some stuff happened..."
      />
      <Notification
        type={NotificationType.Error}
        title="Failed to install dependencies"
        description="Failed to download package golang.org/x/tools/syscall: Get https://proxy.golang.org - 500 Internal Status Error"
      />
    </div>
  )
};

export default NotificationHost;
