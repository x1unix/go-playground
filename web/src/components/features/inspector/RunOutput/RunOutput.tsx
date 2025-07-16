import React, { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, MessageBar, MessageBarType, useTheme } from '@fluentui/react'

import { Console, type ConsoleProps } from '~/components/features/inspector/Console'
import { FallbackOutput } from 'components/features/inspector/FallbackOutput'
import { runFileWithParamsDispatcher, type State } from '~/store'
import { DEFAULT_FONT, getDefaultFontFamily, getFontFamily } from '~/services/fonts'

import './RunOutput.css'
import { splitStringUrls } from './parser'
import environment from '~/environment'
import { TurnstileChallenge } from '~/components/elements/misc/TurnstileChallenge'
import { useTurnstile } from '~/hooks/turnstile'

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
  const dispatch = useDispatch()
  const turnstile = useTurnstile()
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

  let content: React.ReactNode | null = null
  if (status?.lastError) {
    content = (
      <div className="RunOutput__container">
        <MessageBar messageBarType={MessageBarType.error} isMultiline={true}>
          <b className="RunOutput__label">Error</b>
          <pre className="RunOutput__errors">{highlightLinks(status.lastError)}</pre>
        </MessageBar>
      </div>
    )
  } else if (status?.cfChallengeRequested) {
    content = (
      <TurnstileChallenge
        className="RunOutput__container"
        siteKey={turnstile?.siteKey}
        onSuccess={(token) => {
          dispatch(
            runFileWithParamsDispatcher({
              turnstileToken: token,
            }),
          )
        }}
        renderError={(err) => (
          <MessageBar messageBarType={MessageBarType.error} isMultiline={true}>
            <b className="RunOutput__label">Error</b>
            <pre className="RunOutput__errors">{err}</pre>
          </MessageBar>
        )}
      />
    )
  } else if (isClean) {
    content = (
      <div
        className="RunOutput__container"
        style={{
          fontFamily,
          fontSize: `${fontSize}px`,
        }}
      >
        Press &quot;Run&quot; to compile program.
      </div>
    )
  } else {
    content = (
      <ConsoleWrapper
        fontFamily={fontFamily}
        fontSize={fontSize}
        status={status}
        backend={renderingBackend}
        disableTerminal={terminal.settings.disableTerminalEmulation}
      />
    )
  }

  return (
    <div className="RunOutput" style={styles}>
      <div className="RunOutput__content">{content}</div>
    </div>
  )
}
