import {loadTheme} from '@uifabric/styling';
import {DarkTheme, LightTheme} from "./colors";

const DARK_THEME_KEY = 'ui.darkTheme.enabled';

function setThemeStyles(isDark: boolean) {
    loadTheme(isDark ? DarkTheme : LightTheme);
}

export const getVariableValue = (key: string, defaultValue: string) =>
    process.env[`REACT_APP_${key}`] ?? defaultValue;

export default {
    appVersion: getVariableValue('VERSION', '1.0.0'),
    serverUrl: getVariableValue('LANG_SERVER', window.location.origin),
    githubUrl: getVariableValue('GITHUB_URL', 'https://github.com/x1unix/go-playground'),

    get darkThemeEnabled(): boolean {
        const v = localStorage.getItem(DARK_THEME_KEY);
        return v === 'true';
    },

    set darkThemeEnabled(enable: boolean) {
        setThemeStyles(enable);
        localStorage.setItem(DARK_THEME_KEY, enable ? 'true' : 'false');
    },

    sync() {
        setThemeStyles(this.darkThemeEnabled);
    }
};