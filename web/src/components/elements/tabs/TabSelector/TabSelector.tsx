import React, { useMemo, useCallback } from 'react'
import {
  useTheme,
  Text,
  Stack,
  FontIcon,
  Dropdown,
  mergeStyles,
  DefaultSpacing,
  type IStackStyles,
  type IDropdownStyles,
  type IDropdownOption,
} from '@fluentui/react'
import type { TabInfo, TabKey, TabIconStyles } from '../types'
import { TabActionBar } from '../TabActionBar'

interface Props {
  tabs?: TabInfo[] | null
  disabled?: boolean
  icon?: TabIconStyles
  placeholder?: string
  selectedTab?: TabKey | null
  onSelected?: (key: TabKey, i: number) => void
  onClosed?: (key: TabKey, i: number) => void
}

const tabLabelStyles = mergeStyles({
  flex: 1,
  alignSelf: 'baseline',
  // Prevent overflow
  minWidth: 0,
})

const containerStyles: IStackStyles = {
  root: {
    flex: 1,

    // Prevent children width overflow
    minWidth: 0,
  },
}

export const TabSelector: React.FC<Props> = ({
  tabs,
  disabled,
  icon,
  selectedTab,
  placeholder,
  onClosed,
  onSelected,
}) => {
  const theme = useTheme()
  const dropdownStyles: Partial<IDropdownStyles> = useMemo(() => {
    const { semanticColors, palette } = theme
    return {
      title: {
        borderColor: semanticColors.variantBorder,
        borderRightColor: palette.white,
        borderRadius: 0,
      },
      label: {
        display: 'flex',
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

  const onRenderTitle = useCallback(
    (opts?: IDropdownOption<any>[]) => {
      const label = opts?.[0].text
      if (!label) {
        return null
      }

      if (!icon) {
        return <span>{label}</span>
      }

      const {
        active: { icon: iconName, color },
      } = icon
      return (
        <Stack grow horizontal verticalAlign="center" horizontalAlign="stretch">
          <Stack.Item>
            <FontIcon aria-hidden iconName={iconName} style={{ color, paddingRight: DefaultSpacing.s1 }} />
          </Stack.Item>
          <Stack.Item className={tabLabelStyles}>
            <Text block nowrap>
              {label}
            </Text>
          </Stack.Item>
        </Stack>
      )
    },
    [icon],
  )

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
    <Stack
      grow
      horizontal
      verticalFill
      horizontalAlign="stretch"
      verticalAlign="stretch"
      styles={containerStyles}
      data-component="TabSelector"
    >
      <Stack.Item>
        <TabActionBar disabled={disabled || !selectedTab} actions={actions} />
      </Stack.Item>
      <Stack.Item style={{ flex: '1', minWidth: 0 }}>
        <Dropdown
          options={options}
          disabled={disabled || !selectedTab}
          selectedKey={selectedTab}
          placeholder={placeholder}
          styles={dropdownStyles}
          onRenderTitle={onRenderTitle}
          onChange={(_, opt) => {
            opt && onSelected?.(opt.key as TabKey, 0)
          }}
        />
      </Stack.Item>
    </Stack>
  )
}
