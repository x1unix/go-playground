import {
  type IStackStyles,
} from '@fluentui/react';

export const tabHeaderStyles: IStackStyles = {
  root: {
    alignItems: 'stretch',
    // background: 'red',
    // color: DefaultPalette.white,
    display: 'flex',
    // justifyContent: 'center',
    overflow: 'hidden',
  },
};

export const tabContentStyles: IStackStyles = {
  root: {
    // alignItems: 'center',
    alignItems: 'stretch',
    // background: DefaultPalette.themePrimary,
    // color: DefaultPalette.white,
    display: 'flex',
    flexDirection: 'column',
    // height: 50,
    // justifyContent: 'center',
    overflow: 'hidden',
  },
};

export const containerStyles: IStackStyles = {
  root: {
    height: '100%',
    overflow: 'hidden',
    flex: 1,
  }
}
