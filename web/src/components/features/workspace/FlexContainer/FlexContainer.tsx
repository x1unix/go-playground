import React from 'react'

type Props = Omit<React.HTMLAttributes<HTMLDivElement>, 'style'>

export const FlexContainer = React.forwardRef<HTMLDivElement, Props>(function FlexContainer(
  { children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      style={{
        flex: '1 1',
        overflow: 'hidden',
      }}
      {...props}
    >
      {children}
    </div>
  )
})
