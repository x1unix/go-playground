import type { IIconProps } from '@fluentui/react'

export interface TabBarAction {
  key?: string
  label: string
  icon: IIconProps
  onClick?: () => void
}

export type TabKey = string
export interface TabInfo {
  key: TabKey
  label: string
}

export interface TabIconStyle {
  icon: string
  color: string
}

export interface TabIconStyles {
  active: TabIconStyle
  inactive: TabIconStyle
}
