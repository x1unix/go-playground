import React, { useMemo } from 'react'
import { Stack, useTheme } from '@fluentui/react'
import { containerStyles, tabHeaderStyles, getTabContentStyles } from './styles'

import { TabHeader } from '../TabHeader'
import { type TabBarAction, type TabInfo } from '../types'

interface Props {
  actions?: TabBarAction[]
  tabs?: TabInfo[] | null
  disabled?: boolean
  selectedTab?: string | null
  allowEmpty?: boolean
  onSelected?: (key: string, i: number) => void
  onClosed?: (key: string, i: number) => void
}

export const TabView: React.FC<Props> = ({ children, ...props }) => {
  const theme = useTheme()
  const tabContentStyles = useMemo(() => getTabContentStyles(theme), [theme])

  return (
    <Stack grow verticalFill horizontalAlign="stretch" verticalAlign="stretch" styles={containerStyles}>
      <Stack.Item styles={tabHeaderStyles}>
        <TabHeader {...props} />
      </Stack.Item>
      <Stack.Item grow disableShrink styles={tabContentStyles}>
        {children}
      </Stack.Item>
    </Stack>
  )
}
