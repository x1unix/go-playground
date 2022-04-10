import React, {useEffect} from 'react';
import {connect} from 'react-redux';
import {ThemeProvider, ThemeProviderProps} from '@fluentui/react/lib/Theme';
import {
  getThemeFromVariant,
  isDarkModeEnabled,
  supportsPreferColorScheme,
  ThemeVariant,
  usePrefersColorScheme
} from '~/utils/theme';
import {newSettingsChangeAction} from "~/store";

interface Props extends ThemeProviderProps {
  darkMode?: boolean
  useSystemTheme?: boolean
  dispatch?: Function
}

const getInitialTheme = (userDarkModeEnabled?: boolean, useSystemTheme?: boolean) => {
  if (useSystemTheme && supportsPreferColorScheme()) {
    return { currentTheme: isDarkModeEnabled() ? ThemeVariant.dark : ThemeVariant.light, matchMedia: true};
  }

  return { currentTheme: userDarkModeEnabled ? ThemeVariant.dark : ThemeVariant.light, matchMedia: false};
};

const ConnectedThemeProvider: React.FunctionComponent<Props> = ({darkMode, useSystemTheme, children, dispatch, ...props}) => {
  const { currentTheme, matchMedia } = getInitialTheme(darkMode, useSystemTheme);
  const theme = usePrefersColorScheme(currentTheme, matchMedia);

  useEffect(() => {
    dispatch?.(newSettingsChangeAction({ darkMode: theme === ThemeVariant.dark}));
  }, [theme])
  return (
    <ThemeProvider theme={getThemeFromVariant(theme)} {...props}>
      {children}
    </ThemeProvider>
  );
};

export default connect(({settings: {darkMode, useSystemTheme}, dispatch}: any) =>
  ({darkMode, useSystemTheme, dispatch}))(ConnectedThemeProvider);
