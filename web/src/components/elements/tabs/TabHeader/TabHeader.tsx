import React, { useMemo } from 'react'
import { useTheme, Stack, FocusZone, type IStackStyles } from '@fluentui/react'

import { TabLabel } from '../TabLabel'
import { TabActionBar } from '../TabActionBar'
import { TabSelector } from '../TabSelector'
import type { TabBarAction, TabInfo, TabKey } from '../types'

interface Props {
  compact?: boolean
  disabled?: boolean
  icon?: string
  tabs?: TabInfo[] | null
  actions?: TabBarAction[]
  selectedTab?: TabKey | null
  allowEmpty?: boolean
  placeholder?: string
  onSelected?: (key: TabKey, i: number) => void
  onClosed?: (key: TabKey, i: number) => void
}

const tabContainerStyles: IStackStyles = {
  root: {
    flex: 1,
    minWidth: 0,
  },
}

export const TabHeader: React.FC<Props> = ({
  tabs,
  icon,
  actions,
  allowEmpty,
  selectedTab,
  onSelected,
  onClosed,
  placeholder,
  compact,
  disabled,
}) => {
  const { semanticColors } = useTheme()
  const headerStyles = useMemo(() => {
    return {
      root: {
        flex: '1 0',
        flexShrink: 0,
        background: semanticColors.bodyStandoutBackground,
        minWidth: 160,
      },
      inner: {
        justifyContent: 'flex-end',
      },
    }
  }, [semanticColors])

  const cmdToolbarStyles: IStackStyles = {
    root: {
      display: 'flex',
    },
  }

  return (
    <FocusZone style={{ flex: 1 }}>
      <Stack
        grow
        // wrap={!compact}
        horizontal
        verticalFill
        horizontalAlign="stretch"
        verticalAlign="stretch"
        styles={headerStyles}
        data-component="TabHeader"
      >
        {compact ? (
          <TabSelector
            tabs={tabs}
            icon={icon}
            disabled={disabled}
            selectedTab={selectedTab}
            placeholder={placeholder}
            onSelected={onSelected}
            onClosed={onClosed}
          />
        ) : (
          tabs?.map(({ key, label }, i) => (
            <Stack.Item key={key} styles={tabContainerStyles}>
              <TabLabel
                label={label}
                icon={icon}
                active={key === selectedTab}
                canClose={allowEmpty || tabs?.length > 1}
                disabled={disabled}
                onClick={() => key !== selectedTab && onSelected?.(key, i)}
                onClose={() => onClosed?.(key, i)}
              />
            </Stack.Item>
          ))
        )}
        <Stack.Item styles={cmdToolbarStyles}>
          <TabActionBar actions={actions} disabled={disabled} />
        </Stack.Item>
      </Stack>
    </FocusZone>
  )
}
