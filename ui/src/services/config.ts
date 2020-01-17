const DARK_THEME_KEY = 'ui.darkTheme.enabled';

export default {
    get darkThemeEnabled(): boolean {
        const v = localStorage.getItem(DARK_THEME_KEY);
        return v === 'true';
    },

    set darkThemeEnabled(val: boolean) {
      localStorage.setItem(DARK_THEME_KEY, val ? 'true' : 'false');
    }
};