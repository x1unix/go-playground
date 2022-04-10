import React from 'react';
import {connect} from 'react-redux';
import {ThemeProvider, ThemeProviderProps} from '@fluentui/react/lib/Theme';
import { LightTheme, DarkTheme } from '~/services/colors';

interface Props extends ThemeProviderProps {
  darkMode?: boolean
}

const ConnectedThemeProvider: React.FunctionComponent<Props> = ({darkMode, children, ...props}) => (
  <ThemeProvider theme={darkMode ? DarkTheme : LightTheme} {...props}>
    {children}
  </ThemeProvider>
);

export default connect(({settings: {darkMode}}: any) => ({darkMode}))(ConnectedThemeProvider);
