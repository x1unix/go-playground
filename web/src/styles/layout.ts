export enum LayoutType {
  Horizontal = 'horizontal',
  Vertical = 'vertical'
}

export const DEFAULT_PANEL_HEIGHT = 300;
export const DEFAULT_PANEL_WIDTH = 320;
export const DEFAULT_PANEL_LAYOUT = LayoutType.Vertical;

export const defaultPanelProps = {
  height: DEFAULT_PANEL_HEIGHT,
  width: DEFAULT_PANEL_WIDTH,
  layout: DEFAULT_PANEL_LAYOUT,
};
