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
} from '@fluentui/react'

import type { Snippet } from '~/services/examples'

interface Props {
  label: string
  snippets: Snippet[]
}

const fallbackIcon = 'TestExploreSolid'

const placeholder = <div style={{ width: '100%', padding: DefaultSpacing.s1 }} />

const stackStyles = {
  root: {
    margin: `0 -${DefaultSpacing.s1}`,
  },
}

const stackItemStyles: IStackItemProps['styles'] = {
  root: mergeStyles({
    flexGrow: 1,
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

const renderButtonText = (props?: IButtonProps) => {
  return (
    <Text nowrap block>
      {props?.text}
    </Text>
  )
}

export const ExamplesSection: React.FC<Props> = ({ label, snippets }) => {
  const { semanticColors } = useTheme()
  const needPlaceholder = snippets.length % 2 !== 0
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

  const btnStyles = {
    root: {
      maxWidth: 'none',
      minWidth: 'none',
      flex: '1',
      padding: `0 ${DefaultSpacing.s1}`,
      margin: DefaultSpacing.s1,
      borderColor: semanticColors.variantBorder,
    },
    icon: {
      marginRight: DefaultSpacing.s1,
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
        {snippets.map(({ label, ...snippet }, i) => (
          <Stack.Item key={i} styles={stackItemStyles}>
            <DefaultButton
              styles={btnStyles}
              iconProps={getIconProps(snippet)}
              text={label}
              onRenderText={renderButtonText}
            />
          </Stack.Item>
        ))}
        {needPlaceholder && (
          <Stack.Item key="$placeholder" styles={stackItemStyles}>
            {placeholder}
          </Stack.Item>
        )}
      </Stack>
    </div>
  )
}
