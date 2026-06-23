import React, { useMemo, useState } from 'react'
import { Stack, Text, TextField, useTheme, type ITextFieldStyles, type ITheme } from '@fluentui/react'
import { useDispatch, useSelector } from 'react-redux'

import { TargetType } from '~/services/config'
import { type State, newRunTargetChangeDispatcher } from '~/store'
import { getStyles } from './styles'

const createTextFieldStyles = (theme: ITheme, isDisabled: boolean): Partial<ITextFieldStyles> => {
  const { palette } = theme
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
  const status = useSelector(({ status }: State) => status)

  const isWasmMode = runTarget.target === TargetType.WebAssembly
  const isDisabled = Boolean(status?.loading || status?.running)

  const [compilerOptions, setCompilerOptions] = useState(runTarget.opts?.compilerOptions ?? '')

  const styles = useMemo(() => getStyles(theme), [theme])
  const textFieldStyles = useMemo(() => createTextFieldStyles(theme, isDisabled), [theme, isDisabled])

  if (!isWasmMode) {
    return null
  }

  return (
    <Stack className={styles.root}>
      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: '.5rem' }} className={styles.row}>
        <Text variant="small" className={styles.label}>
          Compiler options
        </Text>
        <div className={styles.field}>
          <TextField
            value={compilerOptions}
            disabled={isDisabled}
            styles={textFieldStyles}
            placeholder={`-gcflags='all=-N -l'`}
            onChange={(_, value) => setCompilerOptions(value ?? '')}
            onBlur={() => {
              dispatch(
                newRunTargetChangeDispatcher({
                  ...runTarget,
                  opts: {
                    ...runTarget.opts,
                    compilerOptions,
                  },
                }),
              )
            }}
          />
        </div>
      </Stack>
    </Stack>
  )
}
