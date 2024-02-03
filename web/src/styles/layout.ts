export enum LayoutType {
  Horizontal = 'horizontal',
  Vertical = 'vertical',
}

export const DEFAULT_PANEL_HEIGHT = 35
export const DEFAULT_PANEL_WIDTH = 35
export const DEFAULT_PANEL_LAYOUT = LayoutType.Vertical

export const defaultPanelProps = {
  heightPercent: DEFAULT_PANEL_HEIGHT,
  widthPercent: DEFAULT_PANEL_WIDTH,
  layout: DEFAULT_PANEL_LAYOUT,
}
