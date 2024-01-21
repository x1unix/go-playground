import type {IDropdownOption} from '@fluentui/react';
import {RenderingBackend} from '~/store/terminal/types';
import {DEFAULT_FONT, getAvailableFonts} from '~/services/fonts';

export const cursorBlinkOptions: IDropdownOption[] = [
  { key: 'blink', text: 'Blink (default)' },
  { key: 'smooth', text: 'Smooth' },
  { key: 'phase', text: 'Phase' },
  { key: 'expand', text: 'Expand' },
  { key: 'solid', text: 'Solid' },
];

export const cursorLineOptions: IDropdownOption[] = [
  { key: 'line', text: 'Line (default)' },
  { key: 'block', text: 'Block' },
  { key: 'underline', text: 'Underline' },
  { key: 'line-thin', text: 'Line thin' },
  { key: 'block-outline', text: 'Block outline' },
  { key: 'underline-thin', text: 'Underline thin' },
];

export const fontOptions: IDropdownOption[] = [
  { key: DEFAULT_FONT, text: 'System default' },
  ...getAvailableFonts().map(f => ({
    key: f.family,
    text: f.label,
  }))
];

export const terminalBackendOptions: IDropdownOption[] = [
  { key: RenderingBackend.Canvas, text: 'Canvas' },
  { key: RenderingBackend.DOM, text: 'DOM' },
  { key: RenderingBackend.WebGL, text: 'WebGL (experimental)' },
];
