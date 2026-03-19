import React, { type CSSProperties, type MouseEventHandler } from 'react'
import { FontIcon } from '@fluentui/react/lib/Icon'
import { clsx } from 'clsx'
import styles from './StatusBarItem.module.css'

export interface StatusBarItemProps {
  icon?: string | React.ComponentType
  className?: string
  iconOnly?: boolean
  imageSrc?: string
  button?: boolean
  disabled?: boolean
  hidden?: boolean
  mobileHidden?: boolean | 'icononly'
  href?: string
  title?: string
  onClick?: MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>
  style?: CSSProperties
}

const getIcon = (icon: string | React.ComponentType) =>
  typeof icon === 'string' ? (
    <FontIcon iconName={icon} className={styles['StatusBarItem__icon']} />
  ) : (
    React.createElement<any>(icon, {
      className: styles['StatusBarItem__icon'],
    })
  )

const getItemContents = ({ icon, iconOnly, imageSrc, title, children }) => (
  <>
    {icon && getIcon(icon)}
    {imageSrc && <img src={imageSrc} className={styles['StatusBarItem__icon--image']} alt={title} />}
    {!iconOnly && <span className={styles['StatusBarItem__label']}>{children}</span>}
  </>
)

export const StatusBarItem: React.FC<StatusBarItemProps> = ({
  title,
  className,
  icon,
  iconOnly,
  imageSrc,
  mobileHidden,
  href,
  button,
  children,
  hidden,
  ...props
}) => {
  if (hidden) {
    return null
  }

  const content = getItemContents({ icon, iconOnly, children, imageSrc, title })
  const classValue = clsx(
    styles.StatusBarItem,
    mobileHidden === true && styles['StatusBarItem--mobileHidden'],
    mobileHidden === 'icononly' && styles['StatusBarItem--mobileIconOnly'],
  )
  if (button) {
    return (
      <button className={clsx(classValue, styles['StatusBarItem--action'], className)} title={title} {...props}>
        {content}
      </button>
    )
  }

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={clsx(classValue, styles['StatusBarItem--action'], className)}
        title={title}
        {...props}
      >
        {content}
      </a>
    )
  }

  const { style } = props
  return (
    <div className={clsx(classValue, styles['StatusBarItem--text'], className)} title={title} style={style}>
      {content}
    </div>
  )
}
