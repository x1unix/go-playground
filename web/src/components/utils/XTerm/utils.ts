import type { Theme } from '@fluentui/theme';
import type { ITheme } from 'xterm';

/**
 * Constructs XTerm theme from FluentUI theme
 * @see https://xtermjs.org/docs/api/terminal/interfaces/itheme/
 *
 * @param theme Current FluentUI theme
 */
export const buildXtermTheme = (theme: Theme): ITheme => {
  const { palette, semanticColors } = theme
  return {
    foreground: palette.neutralPrimary,
    background: palette.neutralLight,
    cursor: palette.neutralPrimary,
    cursorAccent: palette.neutralPrimary,
    selectionForeground: palette.neutralLight,
    selectionBackground: semanticColors.inputPlaceholderBackgroundChecked,
    black: palette.neutralPrimary,
    red: palette.red,
    green: palette.green,
    yellow: palette.yellow,
    blue: palette.blue,
    magenta: palette.magenta,
    cyan: '#99ffff',
    white: palette.neutralLighter,
    brightBlack: palette.neutralPrimary,
    brightRed: palette.red,
    brightGreen: palette.green,
    brightYellow: palette.yellow,
    brightBlue: palette.blue,
    brightMagenta: palette.magenta,
    brightCyan: '#78ffff',
    brightWhite: palette.neutralLighter,
  }
}
