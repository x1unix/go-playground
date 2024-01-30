import { mapByAction } from '../helpers'
import type { Action } from '../actions'
import type { TerminalSettings } from './types'
import { type TerminalState, initialTerminalState } from './state'
import { TerminalAction } from './actions'

export const reducers = mapByAction<TerminalState>(
  {
    [TerminalAction.SETTINGS_CHANGE]: (s: TerminalState, { payload }: Action<Partial<TerminalSettings>>) => {
      const { settings, ...rest } = s
      return {
        ...rest,
        settings: {
          ...settings,
          ...payload,
        },
      }
    },
  },
  initialTerminalState,
)
