import { isTouchDevice } from '~/utils/dom';

export enum RenderingBackend {
  DOM = 'dom',
  WebGL = 'webgl',
  Canvas = 'canvas'
}

export interface TerminalSettings {
  emulateTerminal: boolean
  fontSize: number
  renderingBackend: RenderingBackend
}

export const defaultTerminalSettings: TerminalSettings = {
  emulateTerminal: isTouchDevice(),
  renderingBackend: RenderingBackend.Canvas,
  fontSize: 14,
}
