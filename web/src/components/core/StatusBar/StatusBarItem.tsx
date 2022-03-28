import React, {CSSProperties, MouseEventHandler} from 'react';
import { FontIcon } from '@fluentui/react/lib/Icon';
import './StatusBarItem.css';

interface Props {
  iconName?: string
  iconOnly?: boolean
  imageSrc?: string
  button?: boolean
  disabled?: boolean
  hideTextOnMobile?: boolean
  href?: string
  title?: string
  onClick?: MouseEventHandler<HTMLButtonElement|HTMLAnchorElement>
  style?: CSSProperties
}

const getItemContents = ({iconName, iconOnly, imageSrc, title, children}) => (
  <>
    {
      iconName && (
        <FontIcon iconName={iconName} className="StatusBarItem__icon"/>
      )
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

const StatusBarItem: React.FC<Props> = ({
  title, iconName, iconOnly, imageSrc, hideTextOnMobile,
  href, button, children,  ...props
}) => {
  const content = getItemContents({iconName, iconOnly, children, imageSrc, title});
  const className = hideTextOnMobile ? (
    'StatusBarItem StatusBarItem--hideOnMobile'
  ) : 'StatusBarItem';
  if (button) {
    return (
      <button
        className={`${className} StatusBarItem--action`}
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
        className={`${className} StatusBarItem--action`}
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
      className={`${className} StatusBarItem--text`}
      title={title}
      style={style}
    >
      { content }
    </div>
  );
};

export default StatusBarItem;
