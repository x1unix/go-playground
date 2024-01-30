import { useMemo } from 'react'
import { useTheme } from '@fluentui/react'
import type { ITheme } from '@xterm/xterm'
import { buildXtermTheme } from './utils'

/**
 * Hook to obtain xterm theme based on a global FluentUI theme.
 */
export const useXtermTheme = (): ITheme => {
  const theme = useTheme()

  return useMemo(() => buildXtermTheme(theme), [theme])
}
