import { mergeStyleSets, type ITheme } from '@fluentui/react'

export const getStyles = (theme: ITheme) =>
  mergeStyleSets({
    root: {
      borderBottom: `1px solid ${theme.semanticColors.disabledBorder}`,
      background: theme.palette.neutralLighterAlt,
      padding: '0.35rem 0.75rem 0.45rem',
      flex: '0 0 auto',
    },
    row: {
      width: '100%',
      selectors: {
        '@media (max-width: 640px)': {
          flexDirection: 'column',
          alignItems: 'stretch',
        },
      },
    },
    label: {
      flex: '0 0 auto',
      color: theme.semanticColors.bodySubtext,
      whiteSpace: 'nowrap',
      lineHeight: '1.1',
      selectors: {
        '@media (max-width: 640px)': {
          whiteSpace: 'normal',
        },
      },
    },
    field: {
      flex: '1 1 auto',
      minWidth: 0,
    },
  })
