import React, {useMemo} from 'react';
import {MessageBar, MessageBarType, useTheme} from '@fluentui/react';

import {getDefaultFontFamily} from '~/services/fonts';
import {connect, StatusState} from '~/store';

import EvalEventView from './EvalEventView';
import './Preview.css';

interface OwnProps {}

interface StateProps {
  status?: StatusState
}

interface PreviewContentProps {
  status?: StatusState
}

const PreviewContent: React.FC<PreviewContentProps> = ({status}) => {
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

  const content = status.events?.map(({Message, Kind}, k) => (
    <EvalEventView
      key={k}
      message={Message}
      kind={Kind}
    />
  )) ?? [];

  if (!status.running) {
    content.push(
      <div className="app-preview__epilogue" key="exit">
        Program exited.
      </div>
    );
  }

  return (
    <>{content}</>
  );
}

const Preview: React.FC<StateProps & OwnProps> = ({ status }) => {
  const theme = useTheme();
  const styles = useMemo(() => {
    const { palette } = theme;
    return {
      backgroundColor: palette.neutralLight,
      color: palette.neutralDark,
      fontFamily: getDefaultFontFamily(),
    }
  }, [theme]);

  return (
    <div className="app-preview" style={styles}>
      <div className='app-preview__content'>
        <PreviewContent status={status} />
      </div>
    </div>
  )
}

const ConnectedPreview = connect<StateProps, OwnProps>((
  { status }
  // { settings: {darkMode}, runTarget: { target }, status }
) => ({
  status
}))(Preview);

export default ConnectedPreview;
