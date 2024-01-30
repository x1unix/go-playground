import React from 'react'
import { type IDropdownOption, Stack, Label, type ISelectableOption, Text } from '@fluentui/react'
import { OptionColors, type DropdownOption } from './options'

const renderTitle = ({ data, text, hidden }: DropdownOption, isDisabled?: boolean): JSX.Element | null => {
  if (hidden) {
    return null
  }

  return (
    <Stack
      horizontal
      verticalAlign="center"
      tokens={{
        childrenGap: '.5rem',
      }}
    >
      {data?.icon && (
        <span
          className="RunTargetSelector__Icon"
          style={{
            color: data.iconColor ?? OptionColors.Default,
          }}
        >
          <data.icon />
        </span>
      )}
      <Label
        className="RunTargetSelector__Title"
        disabled={isDisabled}
        style={{
          padding: 0,
          display: 'inline-block',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {text}
      </Label>
    </Stack>
  )
}

const renderOption = ({ data, text }: DropdownOption): JSX.Element => {
  return (
    <Stack>
      <Stack
        horizontal
        verticalAlign="center"
        tokens={{
          childrenGap: '.5rem',
        }}
      >
        {data?.icon && (
          <span
            style={{
              color: data.iconColor ?? OptionColors.Default,
              display: 'flex',
            }}
          >
            <data.icon />
          </span>
        )}
        <span style={{ padding: 0 }}>{text}</span>
      </Stack>
      <Text block variant="xSmall">
        {data?.description}
      </Text>
    </Stack>
  )
}

export const onRenderTitle = (options?: IDropdownOption[], isDisabled?: boolean): JSX.Element | null =>
  !options ? null : renderTitle(options?.[0] as DropdownOption, isDisabled)

export const onRenderOption = (opt?: ISelectableOption): JSX.Element => renderOption(opt as DropdownOption)
