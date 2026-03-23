import React from 'react'
import './EllipsisText.css'

type Props = React.HTMLAttributes<HTMLSpanElement>

export const EllipsisText = ({ children, ...props }: React.PropsWithChildren<Props>) => (
  <span className="EllipsisText" {...props}>
    {children}
  </span>
)
