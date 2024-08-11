import { mergeStyles, useTheme } from '@fluentui/react'
import React from 'react'

export const Kbd: React.FC = ({ children }) => {
  const { semanticColors } = useTheme()

  const style = mergeStyles({
    padding: '1px 3px',
    borderRadius: '4px',
    background: semanticColors.disabledSubtext,
  })

  return <kbd className={style}>{children}</kbd>
}
