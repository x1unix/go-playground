import React, {useState} from 'react';
import Notification, {NotificationType, NotificationProps } from "./Notification";
import "./NotificationHost.css";

const notifs: NotificationProps[] = [
/*  {
    id: 0,
    title: 'Empty',
  },
  {
    id: 1,
    title: 'Success',
    description: 'All packages installed successfully',
  },
  {
    id: 2,
    title: 'Initializing...',
    progress: {
      indeterminate: true
    },
  },*/
  {
    id: 4,
    title: 'Warning',
    type: NotificationType.Warning,
    description: 'Some warning message'
  },
  {
    id: 3,
    title: 'Installing dependencies...',
    description: 'Downloading golang.org/x/tools/syscall',
    canDismiss: false,
    progress: {
      indeterminate: true
    },
  },
  {
    id: 5,
    title: 'Failed to install dependencies',
    type: NotificationType.Error,
    description: 'Failed to download package golang.org/x/tools/syscall: Get https://proxy.golang.org - 500 Internal Status Error'
  },
];

const NotificationHost = () => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([
    notifs.pop()!
  ]);
  return (
    <div className="NotificationHost">
      {notifications.map((e) => (
        <Notification
          key={e.id}
          {...e}
          onClose={() => {
            const next = notifs.pop();
            if (!next) {
              return;
            }
            setNotifications((prev) => [...prev, next])
          }}
        />
      ))}
    </div>
  )
};

export default NotificationHost;
