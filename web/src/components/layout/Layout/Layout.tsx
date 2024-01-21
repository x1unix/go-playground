import React from 'react';
import {LayoutType} from '~/styles/layout';
import './Layout.css';

interface Props {
  layout?: LayoutType;
}

export const Layout: React.FC<Props> = ({layout = LayoutType.Vertical, children}) => (
  <div className={`Layout Layout--${layout}`}>
    {children}
  </div>
);
