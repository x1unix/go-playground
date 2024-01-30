import React from 'react'
import { Stack, DefaultSpacing, type IStackTokens, type IStackStyles } from '@fluentui/react'

const stackStyles: IStackStyles = {
  root: {
    marginTop: DefaultSpacing.m,
  },
}

const stackTokens: IStackTokens = {
  childrenGap: DefaultSpacing.s1,
}

/**
 * Implements dialog footer with action buttons.
 */
export const DialogActions: React.FC = ({ children }) => {
  return (
    <Stack
      grow
      wrap
      horizontal
      verticalFill
      horizontalAlign="end"
      verticalAlign="center"
      styles={stackStyles}
      tokens={stackTokens}
    >
      {Array.isArray(children) ? (
        children.map((child, i) => <Stack.Item key={i}>{child}</Stack.Item>)
      ) : (
        <Stack.Item>{children}</Stack.Item>
      )}
    </Stack>
  )
}
