import React, { useMemo, useState, useEffect, useRef } from 'react'
import { Stack, useTheme } from '@fluentui/react'
import { FlexContainer } from '~/components/features/workspace/FlexContainer'

import { TabHeader } from '../TabHeader'
import { type TabBarAction, type TabInfo } from '../types'

import { containerStyles, tabHeaderStyles, getTabContentStyles } from './styles'
import { debounce } from './debounce.ts'

interface Props {
  actions?: TabBarAction[]
  tabs?: TabInfo[] | null
  disabled?: boolean
  selectedTab?: string | null
  allowEmpty?: boolean
  responsive?: boolean
  placeholder?: string
  onSelected?: (key: string, i: number) => void
  onClosed?: (key: string, i: number) => void
}

const MAX_COMPACT_WIDTH = 480
const RESIZE_DEBOUNCE_INTERVAL = 100

export const TabView: React.FC<Props> = ({ children, responsive, ...props }) => {
  const theme = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isCompact, setIsCompact] = useState(false)
  const tabContentStyles = useMemo(() => getTabContentStyles(theme), [theme])

  useEffect(() => {
    if (!responsive) {
      return
    }

    const [fn, cleanup] = debounce(
      ([entry]: ResizeObserverEntry[]) => {
        const { width } = entry.contentRect
        setIsCompact(width < MAX_COMPACT_WIDTH)
      },
      RESIZE_DEBOUNCE_INTERVAL,
      { immediate: true },
    )

    const observer = new ResizeObserver(fn)
    observer.observe(containerRef.current!)

    return () => {
      observer.disconnect()
      cleanup()
    }
  }, [responsive])

  return (
    <Stack grow verticalFill horizontalAlign="stretch" verticalAlign="stretch" styles={containerStyles}>
      <Stack.Item styles={tabHeaderStyles}>
        <FlexContainer ref={containerRef}>
          <TabHeader compact={isCompact} {...props} />
        </FlexContainer>
      </Stack.Item>
      <Stack.Item grow disableShrink styles={tabContentStyles}>
        {children}
      </Stack.Item>
    </Stack>
  )
}
