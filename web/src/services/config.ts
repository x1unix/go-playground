import { loadTheme } from '@fluentui/react';
import { DEFAULT_FONT } from './fonts';
import { DarkTheme, LightTheme } from './colors';
import {PanelState} from '~/store';
import { defaultPanelProps } from '~/styles/layout';
import {supportsPreferColorScheme} from "~/utils/theme";

const DARK_THEME_KEY = 'ui.darkTheme.enabled';
const USE_SYSTEM_THEME_KEY = 'ui.darkTheme.useSystem';
const RUNTIME_TYPE_KEY = 'go.build.runtime';
const ENABLE_VIM_MODE_KEY = 'ms.monaco.vimModeEnabled';
const AUTOFORMAT_KEY = 'go.build.autoFormat';
const MONACO_SETTINGS = 'ms.monaco.settings';
const PANEL_SETTINGS = 'ui.layout.panel';


export enum RuntimeType {
  GoPlayground    = 'GO_PLAYGROUND',
  GoTipPlayground = 'GO_TIP_PLAYGROUND',
  WebAssembly     = 'WASM'
}

export namespace RuntimeType {
  export function toString(t?: RuntimeType) {
    if (!t) {
      return;
    }

    switch (t) {
      case RuntimeType.GoTipPlayground:
        return "Go Playground (GoTip)";
      case RuntimeType.GoPlayground:
        return "Go Playground";
      case RuntimeType.WebAssembly:
        return "WebAssembly";
      default:
        return RuntimeType[t];
    }
  }
}

export interface MonacoSettings {
  fontFamily: string,
  fontLigatures: boolean,
  cursorBlinking: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid',
  cursorStyle: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin',
  selectOnLineNumbers: boolean,
  minimap: boolean,
  contextMenu: boolean,
  smoothScrolling: boolean,
  mouseWheelZoom: boolean,
}

const defaultMonacoSettings: MonacoSettings = {
  fontFamily: DEFAULT_FONT,
  fontLigatures: false,
  cursorBlinking: 'blink',
  cursorStyle: 'line',
  selectOnLineNumbers: true,
  minimap: true,
  contextMenu: true,
  smoothScrolling: true,
  mouseWheelZoom: true,
};

function setThemeStyles(isDark: boolean) {
  loadTheme(isDark ? DarkTheme : LightTheme);
}

export const getVariableValue = (key: string, defaultValue: string) =>
  process.env[`REACT_APP_${key}`] ?? defaultValue;

const Config = {
  _cache: {},
  appVersion: getVariableValue('VERSION', '1.0.0'),
  serverUrl: getVariableValue('LANG_SERVER', window.location.origin),
  githubUrl: getVariableValue('GITHUB_URL', 'https://github.com/x1unix/go-playground'),
  issueUrl: getVariableValue('ISSUE_URL', 'https://github.com/x1unix/go-playground/issues/new'),
  donateUrl: getVariableValue('DONATE_URL', 'https://opencollective.com/bttr-go-playground'),

  get darkThemeEnabled(): boolean {
    if (this._cache[DARK_THEME_KEY]) {
      return this._cache[DARK_THEME_KEY];
    }
    return this.getBoolean(DARK_THEME_KEY, false);
  },

  set darkThemeEnabled(enable: boolean) {
    setThemeStyles(enable);
    this._cache[DARK_THEME_KEY] = enable;
    localStorage.setItem(DARK_THEME_KEY, enable.toString());
  },

  get useSystemTheme() {
    if (this._cache[DARK_THEME_KEY]) {
      return this._cache[DARK_THEME_KEY];
    }

    return this.getBoolean(USE_SYSTEM_THEME_KEY, supportsPreferColorScheme());
  },

  set useSystemTheme(val: boolean) {
    this._cache[USE_SYSTEM_THEME_KEY] = val;
    localStorage.setItem(USE_SYSTEM_THEME_KEY, val.toString());
  },

  get enableVimMode() {
    if (this._cache[ENABLE_VIM_MODE_KEY]) {
      return this._cache[ENABLE_VIM_MODE_KEY];
    }

    return this.getBoolean(ENABLE_VIM_MODE_KEY, false);
  },

  set enableVimMode(val: boolean) {
    this._cache[ENABLE_VIM_MODE_KEY] = val;
    localStorage.setItem(ENABLE_VIM_MODE_KEY, val.toString());
  },

  get runtimeType(): RuntimeType {
    if (this._cache[RUNTIME_TYPE_KEY]) {
      return this._cache[RUNTIME_TYPE_KEY];
    }
    return this.getValue<RuntimeType>(RUNTIME_TYPE_KEY, RuntimeType.GoPlayground);
  },

  set runtimeType(newVal: RuntimeType) {
    this._cache[RUNTIME_TYPE_KEY] = newVal;
    localStorage.setItem(RUNTIME_TYPE_KEY, newVal);
  },

  get autoFormat(): boolean {
    if (this._cache[AUTOFORMAT_KEY]) {
      return this._cache[AUTOFORMAT_KEY];
    }
    return this.getBoolean(AUTOFORMAT_KEY, true);
  },

  set autoFormat(v: boolean) {
    this._cache[AUTOFORMAT_KEY] = v;
    localStorage.setItem(AUTOFORMAT_KEY, v.toString());
  },

  get monacoSettings(): MonacoSettings {
    if (this._cache[MONACO_SETTINGS]) {
      return this._cache[MONACO_SETTINGS];
    }
    const val = localStorage.getItem(MONACO_SETTINGS);
    if (!val) {
      this._cache[MONACO_SETTINGS] = defaultMonacoSettings;
      return defaultMonacoSettings;
    }

    try {
      const obj = JSON.parse(val);
      this._cache[MONACO_SETTINGS] = obj;
      return obj as MonacoSettings;
    } catch (err) {
      console.warn('failed to read Monaco settings', err);
      this._cache[MONACO_SETTINGS] = defaultMonacoSettings;
      return defaultMonacoSettings;
    }
  },

  set monacoSettings(m: MonacoSettings) {
    this._cache[MONACO_SETTINGS] = m;
    localStorage.setItem(MONACO_SETTINGS, JSON.stringify(m));
  },

  get panelLayout(): PanelState {
    return this.getObject<PanelState>(PANEL_SETTINGS, {
      ...defaultPanelProps,
    })
  },

  set panelLayout(v: PanelState) {
    this.saveObject(PANEL_SETTINGS, v);
  },

  saveObject<T>(key: string, value: T) {
    this._cache[key] = value;
    localStorage.setItem(key, JSON.stringify(value));
  },

  getObject<T>(key: string, defaultVal: T): T {
    if (this._cache[key]) {
      return this._cache[key];
    }

    const val = localStorage.getItem(key);
    if (!val) {
      return defaultVal;
    }

    try {
      const parsed = JSON.parse(val);
      if (!parsed) {
        return defaultVal;
      }
      this._cache[key] = parsed;
      return parsed;

    } catch (_) {
      return defaultVal;
    }
  },

  getValue<T>(key: string, defaultVal: T): T {
    if (this._cache[key]) {
      return this._cache[key];
    }

    const val = localStorage.getItem(key);
    return (val ?? defaultVal) as T;
  },

  getBoolean(key: string, defVal: boolean): boolean {
    if (this._cache[key]) {
      return this._cache[key];
    }

    const val = localStorage.getItem(key);
    if (!val) {
      return defVal;
    }

    return val === 'true';
  },

  sync() {
    setThemeStyles(this.darkThemeEnabled);
  },

  forceRefreshPage() {
    // document.location.reload(true);
  }
};

export default Config;
