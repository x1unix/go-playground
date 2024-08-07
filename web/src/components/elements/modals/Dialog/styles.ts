import { MotionAnimations, MotionDurations, FontWeights, FontSizes, mergeStyleSets, type ITheme } from '@fluentui/react'

export const getIconButtonStyles = (theme?: ITheme) =>
  mergeStyleSets({
    root: {
      color: theme?.palette.neutralPrimary,
      marginLeft: 'auto',
      marginTop: '4px',
      marginRight: '2px',
    },
    rootHovered: {
      color: theme?.palette.neutralDark,
    },
  })

export const getContentStyles = (theme: ITheme) =>
  mergeStyleSets({
    container: {
      display: 'flex',
      flexFlow: 'column nowrap',
      alignItems: 'stretch',
      width: '95%',
      animation: MotionAnimations.slideDownIn,
      animationDuration: MotionDurations.duration3,
    },
    header: [
      theme.fonts.xLargePlus,
      {
        flex: '1 1 auto',
        borderTop: `4px solid ${theme.palette.themePrimary}`,
        background: theme?.semanticColors.bodyBackground,
        color: theme.palette.neutralPrimary,
        display: 'flex',
        fontSize: FontSizes.xLarge,
        alignItems: 'center',
        fontWeight: FontWeights.semibold,
        padding: '12px 12px 14px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 1,
      },
    ],
    body: {
      flex: '4 4 auto',
      padding: '0 24px 24px 24px',
      overflowY: 'hidden',
      overflowX: 'hidden',
      selectors: {
        p: {
          margin: '14px 0',
        },
        'p:first-child': {
          marginTop: 0,
        },
        'p:last-child': {
          marginBottom: 0,
        },
      },
    },
  })
