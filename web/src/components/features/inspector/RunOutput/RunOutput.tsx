import React, { useMemo } from 'react'
import { MessageBar, MessageBarType, useTheme } from '@fluentui/react'

import { Console } from '~/components/features/inspector/Console'
import { connect, type StatusState } from '~/store'
import type { TerminalState } from '~/store/terminal'
import type { MonacoSettings } from '~/services/config'
import { DEFAULT_FONT, getDefaultFontFamily, getFontFamily } from '~/services/fonts'

import './RunOutput.css'

interface StateProps {
  status?: StatusState
  monaco?: MonacoSettings
  terminal: TerminalState
}

const RunOutput: React.FC<StateProps & {}> = ({ status, monaco, terminal }) => {
  const theme = useTheme()
  const { fontSize, renderingBackend } = terminal.settings
  const styles = useMemo(() => {
    const { palette } = theme
    return {
      backgroundColor: palette.neutralLight,
      color: palette.neutralDark,
      fontFamily: getDefaultFontFamily(),
    }
  }, [theme])
  const fontFamily = useMemo(() => getFontFamily(monaco?.fontFamily ?? DEFAULT_FONT), [monaco])
  const isClean = !status || !status?.dirty

  return (
    <div className="RunOutput" style={styles}>
      <div className="RunOutput__content">
        {status?.lastError ? (
          <div className="RunOutput__container">
            <MessageBar messageBarType={MessageBarType.error} isMultiline={true}>
              <b className="RunOutput__label">Error</b>
              <pre className="RunOutput__errors">{status.lastError}</pre>
            </MessageBar>
          </div>
        ) : isClean ? (
          <div
            className="RunOutput__container"
            style={{
              fontFamily,
              fontSize: `${fontSize}px`,
            }}
          >
            Press &guot;Run&quot; to compile program.
          </div>
        ) : (
          <Console fontFamily={fontFamily} fontSize={fontSize} status={status} backend={renderingBackend} />
        )}
      </div>
    </div>
  )
}

export const ConnectedRunOutput = connect<StateProps, {}>(({ status, monaco, terminal }) => ({
  status,
  monaco,
  terminal,
}))(RunOutput)
