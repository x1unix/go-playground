import React, {useMemo} from 'react';
import {MessageBar, MessageBarType, useTheme} from '@fluentui/react';

import {getDefaultFontFamily} from '~/services/fonts';
import {connect, StatusState} from '~/store';
import {TargetType} from '~/services/config';

import EvalEventView from './EvalEventView';
import './Preview.css';

interface OwnProps {}

interface StateProps {
  targetType?: TargetType
  status?: StatusState
}

const getContent = (isServer: boolean, status?: StatusState) => {
  if (status?.lastError) {
    return (
      <MessageBar messageBarType={MessageBarType.error} isMultiline={true}>
        <b className='app-preview__label'>Error</b>
        <pre className='app-preview__errors'>
            {status.lastError}
          </pre>
      </MessageBar>
    );
  }

  if (!status || !status?.dirty) {
    return (
      <span>Press "Run" to compile program.</span>
    );
  }

  const content = status.events?.map(({Message, Delay, Kind}, k) => (
    <EvalEventView
      key={k}
      message={Message}
      delay={Delay}
      kind={Kind}
      showDelay={isServer}
    />
  )) ?? [];

  if (!status.running) {
    content.push(
      <div className="app-preview__epilogue" key="exit">
        Program exited.
      </div>
    );
  }

  return content;
}

const Preview: React.FC<StateProps & OwnProps> = (
  {
    targetType,
    status
  }
) => {
  const theme = useTheme();
  const styles = useMemo(() => {
    const { palette } = theme;
    return {
      backgroundColor: palette.neutralLight,
      color: palette.neutralDark,
      fontFamily: getDefaultFontFamily(),
    }
  }, [theme]);

  // Some content should not be displayed in WASM mode (like delay, etc)
  const isServer = targetType === TargetType.Server;

  return (
    <div className="app-preview" style={styles}>
      <div className='app-preview__content'>
        {
          getContent(isServer, status)
        }
      </div>
    </div>
  )
}

const ConnectedPreview = connect<StateProps, OwnProps>((
  { runTarget: { target }, status }
  // { settings: {darkMode}, runTarget: { target }, status }
) => ({
  status, targetType: target
}))(Preview);

export default ConnectedPreview;
