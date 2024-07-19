import React from 'react'
import {
  Stack,
  IconButton,
  type ISemanticColors,
  ProgressIndicator,
  DefaultButton,
  PrimaryButton,
  useTheme,
} from '@fluentui/react'
import { FontIcon } from '@fluentui/react/lib/Icon'

import './Notification.css'

export enum NotificationType {
  None = '',
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
}

interface ProgressState {
  indeterminate?: boolean
  total?: number
  current?: number
}

interface NotificationAction {
  label: string
  key: string
  primary?: boolean
  onClick?: () => void
}

export interface NotificationProps {
  id: string
  type?: NotificationType
  title: string
  description?: string
  canDismiss?: boolean
  progress?: ProgressState
  actions?: NotificationAction[]
  onDismiss?: (id: string) => void
  onDismissed?: (id: string) => void
}

const iconColorPaletteMap: { [k in NotificationType]: keyof ISemanticColors } = {
  [NotificationType.Warning]: 'warningHighlight',
  [NotificationType.Error]: 'severeWarningIcon',
  [NotificationType.Info]: 'link',
  [NotificationType.None]: 'inputText',
}

const statusIconMapping: { [k in NotificationType]: string } = {
  [NotificationType.Warning]: 'warning',
  [NotificationType.Error]: 'ErrorBadge',
  [NotificationType.Info]: 'info',
  [NotificationType.None]: 'info',
}

const getPercentComplete = (progress: NotificationProps['progress']): number | undefined => {
  if (!progress || progress?.indeterminate) {
    return
  }

  const { current, total } = progress
  return (current! * 100) / total!
}

const NotificationActionButton: React.FC<Omit<NotificationAction, 'key'>> = ({ label, primary, onClick }) => {
  const ButtonComponent = primary ? PrimaryButton : DefaultButton
  return <ButtonComponent primary={primary} onClick={onClick} text={label} />
}

export const Notification: React.FunctionComponent<NotificationProps> = ({
  id,
  title,
  progress,
  description,
  canDismiss = true,
  type = NotificationType.Info,
  actions,
  onDismiss,
  onDismissed,
}) => {
  const { semanticColors, fonts, ...theme } = useTheme()
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
        <span className="Notification__Title">{title}</span>
        <div className="Notification__Controls">
          {canDismiss && (
            <IconButton
              title="Close"
              ariaLabel="Close notification"
              onClick={() => onDismiss?.(id)}
              style={{
                color: 'inherit',
                width: 'auto',
                height: 'auto',
                padding: 0,
              }}
              iconProps={{
                iconName: 'ChromeClose',
                style: {
                  fontSize: fonts.xSmall.fontSize,
                },
              }}
            />
          )}
        </div>
      </div>
      {(description || progress) && (
        <div className="Notification__Container">
          {description && <div className="Notification__Content">{description}</div>}
          {progress && (
            <div className="Notification__Progress">
              <ProgressIndicator percentComplete={getPercentComplete(progress)} />
            </div>
          )}
        </div>
      )}
      {actions?.length && (
        <Stack horizontal className="Notification__Actions" horizontalAlign="end" tokens={{ childrenGap: 10 }}>
          {actions.map(({ key, onClick, ...props }, i) => (
            <NotificationActionButton
              {...props}
              key={key}
              onClick={() => {
                onClick?.()
                onDismiss?.(id)
              }}
            />
          ))}
        </Stack>
      )}
    </div>
  )
}
