import React, {CSSProperties, MouseEventHandler} from 'react';
import { FontIcon } from '@fluentui/react/lib/Icon';
import {Link} from 'react-router-dom';
import './StatusBarItem.css';

interface Props {
  iconName?: string
  iconOnly?: boolean
  button?: boolean
  disabled?: boolean
  href?: string
  title?: string
  onClick?: MouseEventHandler<HTMLButtonElement>
  style?: CSSProperties
}

const getItemContents = (iconName?: string, iconOnly?: boolean, children?) => (
  <>
    {
      iconName && (
        <FontIcon iconName={iconName} className="StatusBarItem__icon"/>
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

const StatusBarItem: React.FC<Props> = ({iconName, iconOnly, href, button, children,  ...props}) => {
  const content = getItemContents(iconName, iconOnly, children);

  if (button) {
    return (
      <button
        className="StatusBarItem StatusBarItem--action"
        {...props}
      >
        { content }
      </button>
    )
  }

  if (href) {
    return (
      <Link
        href={href}
        target="_blank"
        className="StatusBarItem StatusBarItem--action"
        {...props}
      >
        { content }
      </Link>
    )
  }

  const { style, title } = props;
  return (
    <div
      className="StatusBarItem StatusBarItem--text"
      title={title}
      style={style}
    >
      { content }
    </div>
  );
};

export default StatusBarItem;
