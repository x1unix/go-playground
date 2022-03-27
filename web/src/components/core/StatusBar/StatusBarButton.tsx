import React, {CSSProperties, MouseEventHandler} from 'react';
import { FontIcon } from '@fluentui/react/lib/Icon';
import './StatusBarButton.css';

interface Props {
  iconName?: string
  disabled?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
  style?: CSSProperties
}

const StatusBarButton: React.FC<Props> = ({iconName, children,  ...props}) => (
  <button className="StatusBarButton" {...props}>
    {
      iconName && (
        <FontIcon iconName={iconName} className="StatusBarButton__icon"/>
      )
    }
    <span className="StatusBarButton__label">
      {children}
    </span>
  </button>
);

export default StatusBarButton;
