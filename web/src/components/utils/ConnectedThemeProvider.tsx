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
import {newSettingsChangeAction, SettingsState} from '~/store';

interface Props extends ThemeProviderProps {
  settings?: SettingsState
  dispatch?: Function
}

const getInitialTheme = ({darkMode, useSystemTheme}: SettingsState) => {
  if (useSystemTheme && supportsPreferColorScheme()) {
    return { currentTheme: isDarkModeEnabled() ? ThemeVariant.dark : ThemeVariant.light, matchMedia: true};
  }

  return { currentTheme: darkMode ? ThemeVariant.dark : ThemeVariant.light, matchMedia: false};
};

const ConnectedThemeProvider: React.FunctionComponent<Props> = ({settings, children, dispatch, ...props}) => {
  const { currentTheme, matchMedia } = getInitialTheme(settings as SettingsState);
  const systemTheme = usePrefersColorScheme(currentTheme, matchMedia);
  useEffect(() => {
    dispatch?.(newSettingsChangeAction({ darkMode: systemTheme === ThemeVariant.dark}));
  }, [systemTheme, dispatch]);

  return (
    <ThemeProvider theme={getThemeFromVariant(matchMedia ? systemTheme : currentTheme)} {...props}>
      {children}
    </ThemeProvider>
  );
};

export default connect(({settings, dispatch}: any) =>
  ({settings, dispatch}))(ConnectedThemeProvider);
