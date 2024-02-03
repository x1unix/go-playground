import type { PanelState } from '~/store/state'

export enum LayoutType {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export const DEFAULT_PANEL_HEIGHT = 300
export const DEFAULT_PANEL_WIDTH_PERCENT = 35
export const DEFAULT_PANEL_LAYOUT = LayoutType.Vertical

export const defaultPanelProps: PanelState = {
  height: DEFAULT_PANEL_HEIGHT,
  widthPercent: DEFAULT_PANEL_WIDTH_PERCENT,
  layout: DEFAULT_PANEL_LAYOUT,
}
