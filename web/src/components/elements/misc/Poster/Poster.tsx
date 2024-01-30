import React from 'react'
import {
  useTheme,
  mergeStyles,
  Text,
  Icon,
  Stack,
  FontSizes,
  FontWeights,
  DefaultSpacing,
  type ITextProps,
  type IStackStyles,
  type ITheme,
} from '@fluentui/react'

type PosterType = 'error' | 'warning' | 'info' | 'default'

interface Props {
  label: string
  message?: string
  icon?: string
  type?: 'error' | 'warning' | 'info' | 'default'
  textProps?: ITextProps
  horizontalContent?: boolean
}

const iconClass = mergeStyles({
  fontSize: FontSizes.mega,
  height: FontSizes.mega,
  width: FontSizes.mega,
  marginBottom: DefaultSpacing.s2,
})

const stackStyles: IStackStyles = {
  root: {
    flex: 1,
    padding: `${DefaultSpacing.s1} ${DefaultSpacing.l2}`,
  },
}

const defaultIcons: { [K in PosterType]: string } = {
  error: 'StatusErrorFull',
  warning: 'WarningSolid',
  info: 'InfoSolid',
  default: 'AlertSolid',
}

const mapChildren = (
  children: React.ReactNode | undefined,
  fn: (elem: React.ReactNode, i: number) => React.ReactNode,
) => {
  if (!children) {
    return null
  }

  if (!Array.isArray(children)) {
    return fn(children, 0)
  }

  return children.map(fn)
}

const getIconColor = (type: PosterType, theme: ITheme) => {
  const { semanticColors, palette } = theme
  switch (type) {
    case 'error':
      return semanticColors.errorText
    case 'warning':
      return palette.yellowDark
    case 'info':
      return semanticColors.inputIcon
    default:
      return semanticColors.disabledText
  }
}

export const Poster: React.FC<Props> = ({
  textProps,
  label,
  message,
  icon,
  type = 'default',
  horizontalContent,
  children,
}) => {
  const theme = useTheme()
  const { semanticColors } = theme
  const iconColor = getIconColor(type, theme)
  const headerStyles = mergeStyles({
    fontSize: FontSizes.xLarge,
    fontWeight: FontWeights.semibold,
    textTransform: 'capitalize',
    color: semanticColors.bodyText,
    margin: DefaultSpacing.m,
  })

  return (
    <Stack grow verticalFill horizontalAlign="center" verticalAlign="center" styles={stackStyles}>
      <Stack.Item>
        <Icon className={iconClass} iconName={icon || defaultIcons[type]} style={{ color: iconColor }} />
      </Stack.Item>
      <Stack.Item>
        <h1 className={headerStyles}>{label}</h1>
      </Stack.Item>
      {message && (
        <Stack.Item>
          <Text
            variant="medium"
            style={{
              color: semanticColors.bodySubtext,
            }}
            {...textProps}
          >
            {message}
          </Text>
        </Stack.Item>
      )}
      {children && (
        <Stack.Item>
          <Stack
            grow
            wrap
            horizontal={horizontalContent}
            horizontalAlign="center"
            verticalAlign="center"
            tokens={{
              childrenGap: DefaultSpacing.m,
            }}
            style={{
              marginTop: DefaultSpacing.l2,
            }}
          >
            {mapChildren(children, (child, i) => (
              <Stack.Item key={i}>{child}</Stack.Item>
            ))}
          </Stack>
        </Stack.Item>
      )}
    </Stack>
  )
}
