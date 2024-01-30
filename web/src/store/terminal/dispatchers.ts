import { TerminalAction } from './actions'
import { saveTerminalSettings } from './config'
import type { TerminalSettings } from './types'
import type { DispatchFn, StateProvider } from '../helpers'

/**
 * Creates a new terminal settings update dispatcher.
 *
 * Saves new settings and triggers a settings change action.
 * @param payload Partial terminal settings
 */
export const dispatchTerminalSettingsChange =
  (payload: Partial<TerminalSettings>) => (dispatch: DispatchFn, getState: StateProvider) => {
    const {
      terminal: { settings },
    } = getState()
    saveTerminalSettings({ ...settings, ...payload })
    dispatch({ type: TerminalAction.SETTINGS_CHANGE, payload })
  }
