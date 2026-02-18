import { Compartment } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { vscodeDark, vscodeDarkStyle, vscodeLight } from '@uiw/codemirror-theme-vscode'

import type { ColorScheme } from '../types'

// TODO: infer editor popup styles from state theme.
export const popupHighlightStyles = vscodeDarkStyle

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
})

export const themeCompartment = new Compartment()

const themeExtensionFromName = (scheme?: ColorScheme) => (scheme === 'dark' ? vscodeDark : vscodeLight)

/**
 * Returns theme compartment instance with initial theme.
 */
export const newThemeCompartment = (scheme?: ColorScheme) => themeCompartment.of(themeExtensionFromName(scheme))

/**
 * Returns a new state effect to update theme.
 */
export const updateThemeEffect = (scheme?: ColorScheme) => themeCompartment.reconfigure(themeExtensionFromName(scheme))
