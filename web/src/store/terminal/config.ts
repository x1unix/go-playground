import config from '~/services/config';
import { TerminalSettings, defaultTerminalSettings } from './types';

/**
 * Config key for terminal settings.
 */
export const CONFIG_KEY = 'ui.terminal.settings';

/**
 * Obtains terminal settings from config storage.
 * @param settings
 */
export const saveTerminalSettings = (settings: TerminalSettings) => {
  config.setObject(CONFIG_KEY, settings);
};

/**
 * Persists terminal settings to config storage.
 */
export const loadTerminalSettings = (): TerminalSettings => (
  config.getObject(CONFIG_KEY, defaultTerminalSettings)
);
