import React, {CSSProperties, MouseEventHandler} from 'react';
import { FontIcon } from '@fluentui/react/lib/Icon';
import './StatusBarItem.css';

interface Props {
  iconName?: string
  button?: boolean
  disabled?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
  style?: CSSProperties
}

const StatusBarItem: React.FC<Props> = ({iconName, button, children,  ...props}) => {
  if (button) {
    return (
      <button className="StatusBarItem StatusBarItem--button" {...props}>
        {
          iconName && (
            <FontIcon iconName={iconName} className="StatusBarItem__icon"/>
          )
        }
        <span className="StatusBarItem__label">
          {children}
        </span>
      </button>
    )
  }

  const { style } = props;
  return (
    <div className="StatusBarItem StatusBarItem--text" style={style}>
      {
        iconName && (
          <FontIcon iconName={iconName} className="StatusBarItem__icon"/>
        )
      }
      <span className="StatusBarItem__label">
        {children}
      </span>
    </div>
  );
};

export default StatusBarItem;
