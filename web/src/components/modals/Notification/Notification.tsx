import React, { useEffect, useRef } from 'react'
import {
  Stack,
  IconButton,
  type ISemanticColors,
  ProgressIndicator,
  DefaultButton,
  PrimaryButton,
  useTheme,
  MotionTimings,
} from '@fluentui/react'
import { FontIcon } from '@fluentui/react/lib/Icon'
import {
  type Notification as NotificationModel,
  type NotificationAction,
  NotificationType,
} from '~/store/notifications'

import './Notification.css'

export interface NotificationProps extends NotificationModel {
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

/**
 * Computes current progress percentage and returns float value between 0 and 1.
 *
 * Returns undefined if there is no progress data available.
 */
const getPercentComplete = (progress: NotificationProps['progress']): number | undefined => {
  if (!progress || progress?.indeterminate) {
    return
  }

  const { current, total } = progress
  return current! / total!
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
  dismissed,
  onDismiss,
  onDismissed,
}) => {
  const elementRef = useRef<HTMLDivElement | null>(null)
  const { semanticColors, fonts, ...theme } = useTheme()

  useEffect(() => {
    const { current: elem } = elementRef
    if (!dismissed || !elem) {
      return
    }

    // Animate element swipe out + shrink space around.
    // Height should be extracted from JS until "calc-size" is not available.
    const height = elem.clientHeight
    const animation = elem.animate(
      [
        {
          opacity: '1',
          maxHeight: `${height}px`,
          offset: 0,
        },
        {
          opacity: '0.5',
          transform: 'translate3d(120%, 0, 0)',
          maxHeight: `${height}px`,
          offset: 0.5,
        },
        {
          opacity: '0',
          transform: 'translate3d(120%, 0, 0)',
          maxHeight: '0',
          offset: 1.0,
        },
      ],
      { duration: 200, fill: 'forwards', easing: MotionTimings.standard },
    )

    animation.onfinish = () => onDismissed?.(id)
    animation.play()
  }, [id, dismissed, elementRef, onDismissed])
  return (
    <div
      ref={elementRef}
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
