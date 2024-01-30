import React from 'react'
import './EllipsisText.css'

export const EllipsisText: React.FC = ({ children, ...props }) => (
  <span className="EllipsisText" {...props}>
    {children}
  </span>
)
