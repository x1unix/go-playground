import React from "react";
import {IconButton, ISemanticColors, ProgressIndicator, useTheme} from "@fluentui/react";
import { FontIcon } from "@fluentui/react/lib/Icon";

import "./Notification.css"

export enum NotificationType {
  None = '',
  Info = 'info',
  Warning = 'warning',
  Error = 'error'
}

interface ProgressState {
  indeterminate?: boolean
  total?: number
  current?: number
}

export interface NotificationProps {
  id: number|string
  type?: NotificationType
  title: string
  description?: string
  canDismiss?: boolean
  progress?: ProgressState
  onClose?: () => void
}

const iconColorPaletteMap: {[k in NotificationType]: keyof ISemanticColors} = {
  [NotificationType.Warning]: 'warningHighlight',
  [NotificationType.Error]: 'severeWarningIcon',
  [NotificationType.Info]: 'link',
  [NotificationType.None]: 'inputText',
};

const statusIconMapping: {[k in NotificationType]: string} = {
  [NotificationType.Warning]: 'warning',
  [NotificationType.Error]: 'ErrorBadge',
  [NotificationType.Info]: 'info',
  [NotificationType.None]: 'info',
};

const getPercentComplete = (progress: NotificationProps['progress']): (number|undefined) => {
  if (!progress || progress?.indeterminate) {
    return;
  }

  const { current, total } = progress;
  const percentage = (current! * 100) / total!;
  return percentage / 100;
}

const Notification: React.FunctionComponent<NotificationProps> = ({
  id,
  title,
  progress,
  description,
  canDismiss = true,
  type = NotificationType.Info,
  onClose,
}) => {
  const {semanticColors, fonts, ...theme} = useTheme();
  return (
    <div
      className="Notification"
      data-notification-id={id}
      style={{
        background: semanticColors.bodyStandoutBackground,
        boxShadow: theme.effects.elevation16,
        fontSize: fonts.medium.fontSize,
      }}
    >
      <div className="Notification__Header">
        <FontIcon
          className="Notification__Icon"
          iconName={statusIconMapping[type]}
          style={{
            color: semanticColors[iconColorPaletteMap[type]],
            fontSize: fonts.medium.fontSize,
          }}
        />
        <span className="Notification__Title">
          {title}
        </span>
        <div className="Notification__Controls">
          { canDismiss && (
            <IconButton
              title="Close"
              ariaLabel="Close notification"
              onClick={onClose}
              style={{
                color: 'inherit',
                width: 'auto',
                height: 'auto',
                padding: 0,
              }}
              iconProps={{
                iconName: "ChromeClose",
                style: {
                  fontSize: fonts.xSmall.fontSize,
                }
              }}
            />
          )}
        </div>
      </div>
      { (description || progress ) && (
        <div className="Notification__Container">
          { description && (
            <div className="Notification__Content">
              {description}
            </div>
          )}
          { progress && (
            <div className="Notification__Progress">
              <ProgressIndicator
                percentComplete={getPercentComplete(progress)}
              />
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default Notification;
