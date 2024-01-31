import React from 'react'
import { useTheme } from '@fluentui/react'

interface Props {
  hidden?: boolean
}

export const TabPanelPlaceholder: React.FC<Props> = ({ hidden }) => {
  const { semanticColors } = useTheme()

  if (hidden) {
    return null
  }

  const styles = {
    flex: 1,
    borderTop: `1px solid ${semanticColors.variantBorder}`,
    borderBottom: `1px solid ${semanticColors.variantBorder}`,
    padding: '.3rem .3rem .3rem .5rem',
  }
  return <div style={styles}></div>
}
