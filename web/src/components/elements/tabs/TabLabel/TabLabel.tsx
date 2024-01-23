import React, { useMemo } from 'react';
import {
  Stack,
  FontSizes,
  useTheme,
  type IStackStyles
} from '@fluentui/react';

const labelCellStyles: IStackStyles = {
  root: {
    flex: 1,
    // background: '#888',
    fontSize: FontSizes.smallPlus,
  }
};

const closeCellStyles: IStackStyles = {
  root: {
    // background: '#f33',
  }
};

interface Props {
  label: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  onClose?: () => void
}

export const TabLabel: React.FC<Props> = (
  {label, active, disabled, onClick}
) => {
  const theme = useTheme();
  const containerStyles = useMemo(() => {
    const { palette , semanticColors } = theme;
    const background = active ? palette.white : semanticColors.bodyStandoutBackground;

    return {
      root: {
        flex: 1,
        cursor: disabled ? 'default' : 'pointer',
        background,
        borderWidth: 1,
        borderStyle: 'solid',
        borderLeftColor: semanticColors.variantBorder,
        borderRight: 'none',
        borderTopColor: active ? palette.themePrimary : semanticColors.variantBorder,
        borderBottomColor: active ? background : semanticColors.variantBorder,
        padding: '.3rem .5rem',
        fontSize: FontSizes.smallPlus,
        color: active ? semanticColors.bodyText : palette.neutralSecondary,
        ':hover': {
          background: active ? background : semanticColors.bodyBackgroundHovered,
        },
        ':active': {
          background: active ? background : semanticColors.buttonBackgroundPressed,
        }
      }
    }
  }, [theme, active, disabled]);
  return (
    <Stack
      grow
      horizontal
      verticalFill
      horizontalAlign='stretch'
      verticalAlign='center'
      styles={containerStyles}
      onClick={onClick}
    >
      <Stack.Item
        styles={labelCellStyles}
      >
        {label}
      </Stack.Item>
      <Stack.Item
        styles={closeCellStyles}
      >
        &times;
      </Stack.Item>
    </Stack>
  );
};
