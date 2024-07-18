import { MotionAnimations, MotionDurations, mergeStyleSets, type ITheme } from '@fluentui/react'

export const getContentStyles = ({ semanticColors, effects, fonts }: ITheme) =>
  mergeStyleSets({
    root: {
      margin: '10px 10px 0',
      boxSizing: 'border-box',
      padding: '.75rem',
      background: semanticColors.bodyStandoutBackground,
      boxShadow: effects.elevation16,
      fontSize: fonts.medium.fontSize,
      minWidth: '400px',
      maxWidth: '480px',
      '@media (max-width: 479px)': {
        alignItems: 'stretch',
        maxWidth: 'none',
        animation: MotionAnimations.slideRightIn,
        animationDuration: MotionDurations.duration4,
      },
      '@media (min-width: 480px)': {
        minWidth: '400px',
        maxWidth: '480px',
        animation: MotionAnimations.slideUpIn,
        animationDuration: MotionDurations.duration4,
      },
    },
    header: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
    },
    icon: {
      marginRight: '5px',
      marginBottom: '-2px',
      fontSize: fonts.medium.fontSize,
    },
    progress: {
      marginTop: '.3rem',
    },
    close: {
      color: 'inherit !important',
      width: 'auto',
      height: 'auto',
      padding: 0,
    },
    controls: {
      flex: '1 1 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
    },
    container: {
      paddingTop: '.8rem',
      marginBottom: '.4rem',
    },
    actions: {
      marginTop: '1rem',
    },
  })
