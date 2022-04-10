import {useState, useEffect} from "react";
import {DarkTheme, LightTheme} from "@services/colors";

const query = '(prefers-color-scheme)';

export enum ThemeVariant {
  dark = 'dark',
  light = 'light'
}

export const supportsPreferColorScheme = () => {
  if (!('matchMedia' in window)) {
    return false;
  }

  // See: https://kilianvalkhof.com/2021/web/detecting-media-query-support-in-css-and-javascript/
  const { media } = window.matchMedia(query);
  return media === query;
};

export const isDarkModeEnabled = () => {
  if (!supportsPreferColorScheme()) {
    return false;
  }

  const { matches } = window.matchMedia('(prefers-color-scheme: dark)');
  return matches;
}

export const usePrefersColorScheme = (defaultValue: ThemeVariant, enabled = true) : ThemeVariant => {
  const [theme, setTheme] = useState<ThemeVariant>(defaultValue);
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handler = ({matches}) => {
      if (!enabled) {
        return;
      }
      setTheme(matches ? ThemeVariant.dark : ThemeVariant.light);
    };

    const query = window.matchMedia('(prefers-color-scheme: dark)');
    setTheme(query.matches ? ThemeVariant.dark : ThemeVariant.light);

    query.addEventListener('change', handler);
    return () => {
      query.removeEventListener('change', handler);
    }
  }, [enabled]);
  return theme;
}

export const getThemeFromVariant = (variant: ThemeVariant) => (
  variant === ThemeVariant.dark ? DarkTheme : LightTheme
);
