import React, {useMemo} from 'react';
import {MessageBar, MessageBarType, useTheme} from '@fluentui/react';

import { Console } from '~/components/preview/Console';
import {connect, type StatusState} from '~/store';
import type {MonacoSettings} from '~/services/config';
import {
  DEFAULT_FONT,
  getDefaultFontFamily,
  getFontFamily
} from '~/services/fonts';

import './Preview.css';

interface OwnProps {}

interface StateProps {
  status?: StatusState
  monaco?: MonacoSettings
}

const fontSize = 13;

const Preview: React.FC<StateProps & OwnProps> = ({ status, monaco }) => {
  const theme = useTheme();
  const styles = useMemo(() => {
    const { palette } = theme;
    return {
      backgroundColor: palette.neutralLight,
      color: palette.neutralDark,
      fontFamily: getDefaultFontFamily(),
    }
  }, [theme]);
  const fontFamily = useMemo(() => (
    getFontFamily(monaco?.fontFamily ?? DEFAULT_FONT)
  ), [monaco]);
  const isClean = !status || !status?.dirty;

  return (
    <div className="app-preview" style={styles}>
      <div className='app-preview__content'>
        {
          status?.lastError ? (
            <MessageBar messageBarType={MessageBarType.error} isMultiline={true}>
              <b className='app-preview__label'>Error</b>
              <pre className='app-preview__errors'>
                {status.lastError}
              </pre>
            </MessageBar>
          ) : isClean ? (
            <span
              style={{
                fontFamily,
                fontSize: `${fontSize}px`
              }}
            >
              Press "Run" to compile program.
            </span>
          ) : (
            <Console
              fontFamily={fontFamily}
              fontSize={fontSize}
              status={status}
            />
          )
        }
      </div>
    </div>
  )
}

const ConnectedPreview = connect<StateProps, OwnProps>((
  { status, monaco }
) => ({
  status, monaco
}))(Preview);

export default ConnectedPreview;
