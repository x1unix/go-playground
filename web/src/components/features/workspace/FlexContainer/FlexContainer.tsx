import React, { type FC, type PropsWithChildren } from 'react'

export const FlexContainer: FC<PropsWithChildren<{}>> = ({ children }) => (
  <div
    style={{
      flex: '1 1',
      overflow: 'hidden',
    }}
  >
    {children}
  </div>
)
