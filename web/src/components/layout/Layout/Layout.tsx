import React from 'react'
import { LayoutType } from '~/styles/layout'
import './Layout.css'

interface Props {
  layout?: LayoutType
}

export const Layout = ({ layout = LayoutType.Vertical, children }: React.PropsWithChildren<Props>) => (
  <div className={`Layout Layout--${layout}`}>{children}</div>
)
