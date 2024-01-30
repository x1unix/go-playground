import type {IIconProps} from '@fluentui/react';

export interface TabBarAction {
  key?: string
  label: string
  icon: IIconProps
  onClick?: () => void
}

export type TabKey = string;
export interface TabInfo {
  key: TabKey
  label: string
}
