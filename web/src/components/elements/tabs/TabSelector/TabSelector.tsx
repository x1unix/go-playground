import React, { useMemo } from 'react'
import { useTheme, Stack, Dropdown, type IStackStyles, type IDropdownStyles } from '@fluentui/react';
import type { TabInfo, TabKey } from '../types'
import { TabActionBar } from '../TabActionBar'

interface Props {
  tabs?: TabInfo[] | null
  disabled?: boolean
  placeholder?: string
  selectedTab?: TabKey | null
  onSelected?: (key: TabKey, i: number) => void
  onClosed?: (key: TabKey, i: number) => void
}

const containerStyles: IStackStyles = {
  root: {
    flex: 1,
  },
}

export const TabSelector: React.FC<Props> = ({ tabs, disabled, selectedTab, placeholder, onClosed, onSelected }) => {
  const theme = useTheme()
  const dropdownStyles: Partial<IDropdownStyles> = useMemo(() => {
    const { semanticColors, palette } = theme
    return {
      title: {
        borderColor: semanticColors.variantBorder,
        borderRightColor: palette.white,
        borderRadius: 0,
      },
      dropdown: {
        '&:hover .ms-Dropdown-title': {
          borderColor: semanticColors.variantBorder,
          borderRightColor: semanticColors.bodyBackgroundHovered,
          backgroundColor: semanticColors.bodyBackgroundHovered,
        },
        '&:active .ms-Dropdown-title': {
          borderColor: semanticColors.variantBorder,
          borderRightColor: semanticColors.variantBorder,
          backgroundColor: semanticColors.variantBorder,
        },
      },
    }
  }, [theme])

  const options = useMemo(() => {
    return (
      tabs?.map(({ key, label: text }) => ({
        key,
        text,
      })) ?? []
    )
  }, [tabs])

  const actions = [
    {
      label: 'Close tab',
      icon: { iconName: 'Cancel' },
      onClick: () => {
        selectedTab && onClosed?.(selectedTab, 0)
      },
    },
  ]

  return (
    <Stack grow wrap horizontal verticalFill horizontalAlign="stretch" verticalAlign="stretch" styles={containerStyles}>
      <Stack.Item>
        <TabActionBar disabled={disabled || !selectedTab} actions={actions} />
      </Stack.Item>
      <Stack.Item style={{ flex: '1' }}>
        <Dropdown
          options={options}
          disabled={disabled || !selectedTab}
          selectedKey={selectedTab}
          placeholder={placeholder}
          styles={dropdownStyles}
          onChange={(_, opt) => {
            opt && onSelected?.(opt.key as TabKey, 0)
          }}
        />
      </Stack.Item>
    </Stack>
  )
}
