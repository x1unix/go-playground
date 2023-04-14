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
  indeterminate: boolean
  total?: number
  current?: number
}

interface NotificationProps {
  type?: NotificationType
  title: string
  description?: string
  canDismiss?: boolean
  progress?: ProgressState
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

const Notification: React.FunctionComponent<NotificationProps> = ({
  title,
  progress,
  description,
  canDismiss = true,
  type = NotificationType.Info
}) => {
  const {semanticColors, fonts, ...theme} = useTheme();
  console.log(theme);
  return (
    <div
      className="Notification"
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
              <ProgressIndicator />
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default Notification;
