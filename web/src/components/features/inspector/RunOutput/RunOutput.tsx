import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { Link, MessageBar, MessageBarType, useTheme } from '@fluentui/react'

import { Console, type ConsoleProps } from '~/components/features/inspector/Console'
import { FallbackOutput } from 'components/features/inspector/FallbackOutput'
import { type State } from '~/store'
import { DEFAULT_FONT, getDefaultFontFamily, getFontFamily } from '~/services/fonts'

import './RunOutput.css'
import { splitStringUrls } from './parser'

const linkStyle = {
  root: {
    // Fluent UI adds padding with :nth-child selector.
    paddingLeft: '0 !important',
  },
}

const highlightLinks = (str: string) =>
  splitStringUrls(str).map(({ isUrl, content }) =>
    isUrl ? (
      <Link key={content} styles={linkStyle} href={content} target="_blank" rel="noopener noreferrer nofollow">
        {content}
      </Link>
    ) : (
      <React.Fragment key={content}>{content}</React.Fragment>
    ),
  )

const ConsoleWrapper: React.FC<ConsoleProps & { disableTerminal?: boolean }> = (props) => {
  if (props.disableTerminal) {
    return <FallbackOutput {...props} />
  }

  return <Console {...props} />
}

export const RunOutput: React.FC = () => {
  const theme = useTheme()
  const { status, monaco, terminal } = useSelector<State, State>((state) => state)

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
  const isClean = !status?.dirty

  return (
    <div className="RunOutput" style={styles}>
      <div className="RunOutput__content">
        {status?.lastError ? (
          <div className="RunOutput__container">
            <MessageBar messageBarType={MessageBarType.error} isMultiline={true}>
              <b className="RunOutput__label">Error</b>
              <pre className="RunOutput__errors">{highlightLinks(status.lastError)}</pre>
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
            Press &quot;Run&quot; to compile program.
          </div>
        ) : (
          <ConsoleWrapper
            fontFamily={fontFamily}
            fontSize={fontSize}
            status={status}
            backend={renderingBackend}
            disableTerminal={terminal.settings.disableTerminalEmulation}
          />
        )}
      </div>
    </div>
  )
}
