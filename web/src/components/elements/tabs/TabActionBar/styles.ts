import type {
  ITheme,
  IStackStyles,
  IButtonStyles,
} from '@fluentui/react';
import {FontSizes} from "@fluentui/react";

export const commandCellStyles: IStackStyles = {
  root: {
    display: 'flex',
    // flex: 1,
    alignItems: 'stretch',
    flexDirection: 'column',
    alignContent: 'stretch',
    justifyContent: 'stretch',
  }
};

export const getActionBtnStyle = ({semanticColors}: ITheme): IButtonStyles => ({
  icon: {
    fontSize: FontSizes.smallPlus,
    height: FontSizes.smallPlus,
    lineHeight: 'inherit',
  },
  root: {
    flex: 1,
    borderRadius: 0,
    fontSize: FontSizes.smallPlus,
    height: 'auto',
    width: 'auto',
    lineHeight: 'auto',
    padding: '.5rem .3rem',
    color: 'inherit',
    border: '1px solid',
    borderColor: semanticColors.variantBorder,
    borderRight: 'none',
  },
  rootHovered: {
    color: 'inherit',
  },
  rootPressed: {
    color: 'inherit'
  }
});
