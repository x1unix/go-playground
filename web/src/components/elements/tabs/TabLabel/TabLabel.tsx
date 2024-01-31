import React, { useMemo, useCallback } from 'react'
import {
  Stack,
  FontIcon,
  Text,
  FontSizes,
  IconButton,
  useTheme,
  MotionAnimations,
  MotionDurations,
  type IStackStyles,
  type IButtonStyles,
} from '@fluentui/react'
import type { TabIconStyles } from '../types.ts'

const labelCellStyles: IStackStyles = {
  root: {
    flex: 1,
    fontSize: FontSizes.smallPlus,
    minWidth: 0,
  },
}

interface Props {
  label: string
  icon?: TabIconStyles
  active?: boolean
  canClose?: boolean
  disabled?: boolean
  onClick?: () => void
  onClose?: () => void
}

export const TabLabel: React.FC<Props> = ({ label, active, disabled, onClick, onClose, canClose, icon }) => {
  const theme = useTheme()

  const containerStyles: IStackStyles = useMemo(() => {
    const { palette, semanticColors } = theme
    const background = active ? palette.white : semanticColors.bodyStandoutBackground

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
        padding: '.3rem .3rem .3rem .5rem',
        fontSize: FontSizes.smallPlus,
        animation: MotionAnimations.slideUpIn,
        animationDuration: MotionDurations.duration3,
        color: active ? semanticColors.bodyText : palette.neutralSecondary,
        ':hover button': {
          opacity: '1',
        },
        ':focus-visible': {
          outlineColor: palette.themePrimary,
        },
        ':focus button': {
          opacity: '1',
        },
      },
    }
  }, [theme, active, disabled])

  const btnStyles: IButtonStyles = useMemo(() => {
    return {
      icon: {
        height: 'auto',
        lineHeight: 'inherit',
        fontSize: FontSizes.smallPlus,
      },
      root: {
        height: FontSizes.smallPlus,
        width: FontSizes.smallPlus,
        padding: '.5rem .5rem',
        lineHeight: 'auto',
        fontSize: FontSizes.smallPlus,
        color: 'inherit',
        opacity: active ? '1' : '0',
        ':focus': {
          opacity: '1',
        },
      },
      rootHovered: {
        color: 'inherit',
        opacity: '1',
      },
      rootPressed: {
        color: 'inherit',
      },
    }
  }, [active])

  const iconStyle = active ? icon?.active : icon?.inactive

  const handleClose = useCallback(
    (e) => {
      e.stopPropagation()
      onClose?.()
    },
    [onClose],
  )

  return (
    <Stack
      grow
      horizontal
      verticalFill
      horizontalAlign="stretch"
      verticalAlign="center"
      styles={containerStyles}
      onClick={onClick}
      title={label}
      aria-label={label}
      data-is-focusable
    >
      {iconStyle && (
        <Stack.Item>
          <FontIcon
            aria-hidden
            iconName={iconStyle.icon}
            style={{ color: iconStyle.color, paddingRight: '.3rem', fontSize: '.8em' }}
          />
        </Stack.Item>
      )}
      <Stack.Item styles={labelCellStyles}>
        <Text block nowrap variant="smallPlus">
          {label}
        </Text>
      </Stack.Item>
      {canClose ? (
        <Stack.Item>
          <IconButton
            title="Close"
            ariaLabel="Close tab"
            disabled={disabled}
            iconProps={{ iconName: 'Cancel' }}
            styles={btnStyles}
            onClick={handleClose}
          />
        </Stack.Item>
      ) : null}
    </Stack>
  )
}

TabLabel.defaultProps = {
  canClose: true,
}
