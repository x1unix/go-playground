import type {IIconProps} from '@fluentui/react';

export interface TabBarAction {
  label: string
  icon: IIconProps
  onClick?: () => void
}

