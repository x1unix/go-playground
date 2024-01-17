import type { TerminalSettings } from './types';
import { loadTerminalSettings } from './config';

export const initialTerminalState = {
  settings: loadTerminalSettings()
};

export interface TerminalState {
  settings: TerminalSettings
}
