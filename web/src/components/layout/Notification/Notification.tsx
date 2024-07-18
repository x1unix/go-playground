import React, { useMemo, useEffect, useRef } from 'react'
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
import { getContentStyles } from './styles'

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
  id: number | string
  type?: NotificationType
  title: string
  description?: string
  canDismiss?: boolean
  hidden?: boolean
  progress?: ProgressState
  onClose?: () => void
  onClosed?: () => void
  actions?: NotificationAction[]
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
  const percentage = (current! * 100) / total!
  return percentage / 100
}

const NotificationActionButton: React.FC<Omit<NotificationAction, 'key'>> = ({ label, primary, onClick }) => {
  const ButtonComponent = primary ? PrimaryButton : DefaultButton
  return <ButtonComponent primary={primary} onClick={onClick} text={label} />
}

export const Notification: React.FunctionComponent<NotificationProps> = ({
  id,
  title,
  progress,
  hidden,
  actions,
  description,
  canDismiss = true,
  type = NotificationType.Info,
  onClose,
  onClosed,
}) => {
  const elementRef = useRef<HTMLDivElement | null>(null)
  const theme = useTheme()
  const styles = useMemo(() => getContentStyles(theme), [theme])

  useEffect(() => {
    const { current: elem } = elementRef
    if (!hidden || !elem) {
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
      { duration: 100, fill: 'forwards', easing: MotionTimings.standard },
    )

    animation.onfinish = () => onClosed?.()
    animation.play()
  }, [hidden, elementRef, onClosed])
  return (
    <div ref={elementRef} className={styles.root}>
      <div className={styles.header}>
        <FontIcon
          className={styles.icon}
          iconName={statusIconMapping[type]}
          style={{
            color: theme.semanticColors[iconColorPaletteMap[type]],
          }}
        />
        <span className="Notification__Title">{title}</span>
        <div className={styles.controls}>
          {canDismiss && (
            <IconButton
              title="Close"
              ariaLabel="Close notification"
              onClick={onClose}
              className={styles.close}
              iconProps={{
                iconName: 'ChromeClose',
                style: {
                  fontSize: theme.fonts.xSmall.fontSize,
                },
              }}
            />
          )}
        </div>
      </div>
      {(description || progress) && (
        <div className={styles.container}>
          {description && <div className="Notification__Content">{description}</div>}
          {progress && (
            <div className={styles.progress}>
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
                onClose?.()
              }}
            />
          ))}
        </Stack>
      )}
    </div>
  )
}
