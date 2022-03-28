import React from 'react';
import './EllipsisText.css';

interface Props {}

const EllipsisText: React.FC<Props> = ({children, ...props}) => (
  <span className="EllipsisText" {...props}>
    {children}
  </span>
);

export default EllipsisText;
