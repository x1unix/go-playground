import React, {CSSProperties, MouseEventHandler} from 'react';
import { FontIcon } from '@fluentui/react/lib/Icon';
import clsx from 'clsx';
import './StatusBarItem.css';

export interface StatusBarItemProps {
  icon?: string | React.ComponentType,
  className?: string
  iconOnly?: boolean
  imageSrc?: string
  button?: boolean
  disabled?: boolean
  hidden?: boolean
  hideTextOnMobile?: boolean
  href?: string
  title?: string
  onClick?: MouseEventHandler<HTMLButtonElement|HTMLAnchorElement>
  style?: CSSProperties
}

const getIcon = (icon: string | React.ComponentType) => (
  typeof icon === 'string' ? (
    <FontIcon iconName={icon} className="StatusBarItem__icon" />
  ) : (
    React.createElement<any>(icon as React.ComponentType, {
      className: 'StatusBarItem__icon'
    })
  )
)

const getItemContents = ({icon, iconOnly, imageSrc, title, children}) => (
  <>
    {
      icon && getIcon(icon)
    }
    {
      imageSrc && (
        <img src={imageSrc} className="StatusBarItem__icon--image" alt={title} />
      )
    }
    {
      !iconOnly && (
        <span className="StatusBarItem__label">
          {children}
        </span>
      )
    }
  </>
)

const StatusBarItem: React.FC<StatusBarItemProps> = ({
  title,
  className,
  icon,
  iconOnly,
  imageSrc,
  hideTextOnMobile,
  href,
  button,
  children,
  hidden,
  ...props
}) => {
  if (hidden) {
    return null;
  }

  const content = getItemContents({icon, iconOnly, children, imageSrc, title});
  const classValue = hideTextOnMobile ? (
    'StatusBarItem StatusBarItem--hideOnMobile'
  ) : 'StatusBarItem';
  if (button) {
    return (
      <button
        className={clsx(`${classValue} StatusBarItem--action`, className)}
        title={title}
        {...props}
      >
        { content }
      </button>
    )
  }

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={clsx(`${classValue} StatusBarItem--action`, className)}
        title={title}
        {...props}
      >
        { content }
      </a>
    )
  }

  const { style } = props;
  return (
    <div
      className={clsx(`${classValue} StatusBarItem--text`, className)}
      title={title}
      style={style}
    >
      { content }
    </div>
  );
};

export default StatusBarItem;
