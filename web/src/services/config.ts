import {loadTheme} from '@uifabric/styling';
import {DarkTheme, LightTheme} from "./colors";

const DARK_THEME_KEY = 'ui.darkTheme.enabled';

function setThemeStyles(isDark: boolean) {
    loadTheme(isDark ? DarkTheme : LightTheme);
}

export default {
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