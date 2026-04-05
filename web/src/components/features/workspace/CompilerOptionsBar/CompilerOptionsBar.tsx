import React, { useMemo } from 'react'
import { Stack, Text, TextField, getTheme, useTheme, type ITextFieldStyles } from '@fluentui/react'
import { useDispatch, useSelector } from 'react-redux'

import { TargetType } from '~/services/config'
import { type State, newRunTargetChangeDispatcher } from '~/store'

import './CompilerOptionsBar.css'

const createCompilerOptionsStyles = (isDisabled: boolean): Partial<ITextFieldStyles> => {
  const { palette } = getTheme()
  return {
    root: {
      width: '100%',
    },
    fieldGroup: {
      height: '28px',
      backgroundColor: isDisabled ? palette.neutralLighterAlt : undefined,
    },
    field: {
      selectors: {
        '::placeholder': {
          color: isDisabled ? palette.neutralQuaternary : palette.neutralTertiary,
          fontStyle: 'italic',
          opacity: 1,
        },
      },
    },
  }
}

export const CompilerOptionsBar: React.FC = () => {
  const dispatch = useDispatch()
  const theme = useTheme()
  const runTarget = useSelector(({ runTarget }: State) => runTarget)
  const settings = useSelector(({ settings }: State) => settings)
  const status = useSelector(({ status }: State) => status)

  const isWasmMode = runTarget.target === TargetType.WebAssembly
  const compilerOptionsEnabled = settings.enableCompilerOptions
  const compilerOptions = runTarget.opts?.compilerOptions ?? ''

  const textFieldStyles = useMemo(
    () => createCompilerOptionsStyles(Boolean(status?.loading || status?.running || !compilerOptionsEnabled)),
    [compilerOptionsEnabled, status?.loading, status?.running],
  )

  if (!isWasmMode) {
    return null
  }

  return (
    <div
      className="CompilerOptionsBar"
      style={
        {
          '--compiler-options-border': theme.semanticColors.disabledBorder,
          '--compiler-options-bg': theme.palette.neutralLighterAlt,
          '--compiler-options-fg': theme.semanticColors.bodySubtext,
        } as React.CSSProperties
      }
    >
      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: '.5rem' }} className="CompilerOptionsBar__row">
        <Text variant="small" className="CompilerOptionsBar__label">
          Compiler options
        </Text>
        <div
          className="CompilerOptionsBar__field"
          title={compilerOptionsEnabled ? undefined : 'Enable Compiler Options in Settings to edit this field.'}
        >
          <TextField
            value={compilerOptions}
            disabled={Boolean(status?.loading || status?.running || !compilerOptionsEnabled)}
            styles={textFieldStyles}
            placeholder={compilerOptionsEnabled ? `-gcflags='all=-N -l'` : `-gcflags='all=-N -l' (Enable in Settings)`}
            onChange={(_, value) => {
              dispatch(
                newRunTargetChangeDispatcher({
                  ...runTarget,
                  opts: {
                    ...runTarget.opts,
                    compilerOptions: value ?? '',
                  },
                }),
              )
            }}
          />
        </div>
      </Stack>
    </div>
  )
}
