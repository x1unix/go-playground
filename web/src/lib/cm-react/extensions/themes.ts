import { Compartment } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import type { StyleSpec } from 'style-mod'
import { vscodeDarkInit, vscodeDarkStyle, vscodeLightInit } from '@uiw/codemirror-theme-vscode'

import type { ColorScheme } from '../types'

// TODO: infer editor popup styles from state theme.
export const popupHighlightStyles = vscodeDarkStyle

export const defaultFontFamily = [
  'Menlo',
  'Monaco',
  'Consolas',
  '"Andale Mono"',
  '"Ubuntu Mono"',
  '"Courier New"',
  'monospace',
].join(', ')

export const highlightClasses = {
  line: 'line--highlighted',
  gutter: 'gutter--highlighted', // unused atm, reserved when gutter highlight will be implemented.
}

export const defaultThemeStyles = EditorView.theme({
  '&': {
    height: '100%',
    flex: '1 1 auto',
  },
  '& .cm-scroller': {
    height: '100% !important',
  },
  [`& .${highlightClasses.line}`]: {
    background: 'var(--gutter-highlighted-bg, rgba(255, 255, 0, 0.25))',
  },

  // Overrides for vim cursor styles.
  // Colors are defined in ../Editor.module.css
  ['& .cm-cursorLayer.cm-vimCursorLayer .cm-fat-cursor']: {
    color: 'var(--vim-cursor-fg, #fff) !important',
    background: 'var(--vim-cursor-bg, #000)',
  },
  ['&:not(.cm-focused) .cm-cursorLayer.cm-vimCursorLayer .cm-fat-cursor']: {
    color: 'transparent !important',
    background: 'none',
    outline: 'solid 1px var(--vim-cursor-border, #000)',
  },
})

interface ThemeConfig {
  colorScheme: ColorScheme
  fontFamily: string
  fontSize: number
}

export const defaultThemeConfig: ThemeConfig = {
  colorScheme: 'light',
  fontFamily: defaultFontFamily,
  fontSize: 14,
}

export const themeCompartment = new Compartment()

const makeExtensionTheme = ({ colorScheme, fontFamily, fontSize }: ThemeConfig) => {
  const ctor = colorScheme === 'dark' ? vscodeDarkInit : vscodeLightInit

  return ctor({
    theme: colorScheme,
    settings: {
      fontFamily,
      fontSize,
    },
  })
}

/**
 * Returns theme compartment instance with initial theme.
 */
export const newThemeCompartment = (cfg?: ThemeConfig) =>
  themeCompartment.of(makeExtensionTheme(cfg ?? defaultThemeConfig))

/**
 * Returns a new state effect to update theme.
 */
export const updateThemeEffect = (cfg: ThemeConfig) => themeCompartment.reconfigure(makeExtensionTheme(cfg))
