import React, { useCallback } from 'react'
import {
  useTheme,
  mergeStyles,
  getScreenSelector,
  Text,
  DefaultSpacing,
  Stack,
  DefaultButton,
  type IButtonProps,
  type IStackItemProps,
  type IButtonStyles,
} from '@fluentui/react'

import type { Snippet } from '~/services/examples'

interface Props {
  label: string
  snippets: Snippet[]
  onSelect?: (snippet: Snippet) => void
}

const fallbackIcon = 'TestExploreSolid'

const stackStyles = {
  root: {
    margin: `0 -${DefaultSpacing.s1}`,
  },
}

const renderButtonText = (props?: IButtonProps) => {
  return (
    <Text nowrap block>
      {props?.text}
    </Text>
  )
}

export const ExamplesSection: React.FC<Props> = ({ label, snippets, onSelect }) => {
  const { semanticColors } = useTheme()
  const stackItemStyles: IStackItemProps['styles'] = {
    root: mergeStyles({
      flexGrow: snippets.length < 4 ? 1 : 0,
      flexShrink: 0,
      display: 'flex',
      boxSizing: 'border-box',
      [getScreenSelector(0, 500)]: {
        flexBasis: '100%',
      },
      [getScreenSelector(500, 640)]: {
        flexBasis: '50%',
      },
      [getScreenSelector(640, 840)]: {
        flexBasis: '33.3%',
      },
      [getScreenSelector(840, undefined)]: {
        flexBasis: '25%',
      },
    }),
  }

  const textStyles = {
    root: {
      borderBottom: `1px solid ${semanticColors.bodyDivider}`,
      padding: `${DefaultSpacing.s1} 0`,
      marginBottom: DefaultSpacing.s2,
      '.ms-StackItem': {
        flex: 1,
      },
      '.ms-Button': {
        maxWidth: 'none',
        width: '100%',
      },
    },
  }

  const btnStyles: IButtonStyles = {
    root: {
      maxWidth: 'none',
      minWidth: 'none',
      flex: '1',
      padding: `0 ${DefaultSpacing.s1}`,
      margin: DefaultSpacing.s1,
      borderColor: semanticColors.variantBorder,
      justifyContent: 'flex-start',
      alignContent: 'center',
    },
    icon: {
      marginRight: DefaultSpacing.s1,
      height: '1em',
      fontSize: '1em',
      lineHeight: '1em',
    },
    textContainer: {
      textAlign: 'left',
    },
  }

  const getIconProps = useCallback(
    ({ icon, iconColor }: Omit<Snippet, 'label'>) => ({
      iconName: icon ?? fallbackIcon,
      styles: {
        root: {
          color: iconColor ?? semanticColors.disabledText,
        },
      },
    }),
    [semanticColors],
  )

  return (
    <div style={{ marginBottom: DefaultSpacing.m }}>
      <Text nowrap block variant="mediumPlus" styles={textStyles}>
        {label}
      </Text>
      <Stack horizontal wrap grow verticalFill styles={stackStyles}>
        {snippets.map((snippet, i) => (
          <Stack.Item key={i} styles={stackItemStyles}>
            <DefaultButton
              styles={btnStyles}
              iconProps={getIconProps(snippet)}
              text={snippet.label}
              onRenderText={renderButtonText}
              onClick={() => onSelect?.(snippet)}
            />
          </Stack.Item>
        ))}
      </Stack>
    </div>
  )
}
