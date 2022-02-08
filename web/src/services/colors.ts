import { IPartialTheme, DefaultPalette } from '@fluentui/react';

export const LightTheme: IPartialTheme = {
  palette: DefaultPalette,
};

export const DarkTheme: IPartialTheme = {
  palette: {
    neutralLighterAlt: '#282828',
    neutralLighter: '#313131',
    neutralLight: '#3f3f3f',
    neutralQuaternaryAlt: '#484848',
    neutralQuaternary: '#4f4f4f',
    neutralTertiaryAlt: '#6d6d6d',
    neutralTertiary: '#c8c8c8',
    neutralSecondary: '#d0d0d0',
    neutralPrimaryAlt: '#dadada',
    neutralPrimary: '#ffffff',
    neutralDark: '#f4f4f4',
    black: '#f8f8f8',
    white: '#1f1f1f',
    themePrimary: '#3a96dd',
    themeLighterAlt: '#020609',
    themeLighter: '#091823',
    themeLight: '#112d43',
    themeTertiary: '#235a85',
    themeSecondary: '#3385c3',
    themeDarkAlt: '#4ba0e1',
    themeDark: '#65aee6',
    themeDarker: '#8ac2ec',
    accent: '#3a96dd'
  }
};
