import {
  type IStackStyles,
  type ITheme,
} from '@fluentui/react';

export const tabHeaderStyles: IStackStyles = {
  root: {
    alignItems: 'stretch',
    display: 'flex',
    overflow: 'hidden',
    flexShrink: 0,
  },
};

export const getTabContentStyles = (theme: ITheme): IStackStyles => {
  return {
    root: {
      alignItems: 'stretch',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: theme.palette.white,
    },
  }
};

export const containerStyles: IStackStyles = {
  root: {
    height: '100%',
    overflow: 'hidden',
    flex: 1,
  }
}
