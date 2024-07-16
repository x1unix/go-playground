import { DEFAULT_FONT } from '../fonts'

export interface MonacoSettings {
  fontFamily: string
  fontSize?: number
  fontLigatures: boolean
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid'
  cursorStyle: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin'
  selectOnLineNumbers: boolean
  minimap: boolean
  contextMenu: boolean
  smoothScrolling: boolean
  mouseWheelZoom: boolean
}

export const defaultMonacoSettings: MonacoSettings = {
  fontSize: 12,
  fontFamily: DEFAULT_FONT,
  fontLigatures: false,
  cursorBlinking: 'blink',
  cursorStyle: 'line',
  selectOnLineNumbers: true,
  minimap: false,
  contextMenu: true,
  smoothScrolling: true,
  mouseWheelZoom: true,
}
