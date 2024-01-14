import React, {useMemo, useEffect, useState, useRef} from 'react';
import {MessageBar, MessageBarType, useTheme} from '@fluentui/react';

import { ITerminalOptions } from "xterm";
import { FitAddon } from 'xterm-addon-fit';

import {getDefaultFontFamily} from '~/services/fonts';
import {connect, StatusState} from '~/store';

import { XTerm } from '~/components/utils/XTerm';
import { formatEvalEvent, createDebouncableResizeObserver } from './utils';

import './Preview.css';

interface OwnProps {}

interface StateProps {
  status?: StatusState
}

interface PreviewContentProps {
  status?: StatusState
}

const defaultTermConfig: ITerminalOptions = {
  convertEol: true,
  fontSize: 13,
};

const PreviewContent: React.FC<PreviewContentProps> = ({status}) => {
  const [offset, setOffset] = useState(0);
  const xtermRef = useRef<XTerm>(null);
  const fitAddonRef = useRef(new FitAddon());
  const resizeObserver = useMemo(() => {
    return createDebouncableResizeObserver(() => fitAddonRef.current.fit(), 50)
  }, [fitAddonRef]);

  const isClean = !status || !status?.dirty;
  const events = status?.events;
  const terminal = xtermRef.current?.terminal;

  // Track output events
  useEffect(() => {
    if (!events?.length) {
      setOffset(0);
      terminal?.clear();
      return;
    }
    if (offset === 0) {
      terminal?.clear();
    }

    const batch = events?.slice(offset);
    if (!batch) {
      return;
    }

    batch.map(formatEvalEvent).forEach((msg) => terminal?.write(msg));
    terminal?.scrollToBottom();
    setOffset(offset + batch.length);
  }, [terminal, offset, events ])

  // Reset output offset on clean
  useEffect(() => {
    if (isClean) {
      setOffset(0)
    }

  }, [isClean])

  // Track terminal resize
  useEffect(() => {
    console.log('terminal changed!', {terminal});
    if (!terminal?.element) {
      resizeObserver.disconnect();
      return;
    }

    console.log('resize observer installed', {terminal});
    resizeObserver.observe(terminal.element);
    return () => {
      console.log('destroying observer', {terminal});
      resizeObserver.disconnect();
    }
  }, [terminal, resizeObserver])

  if (status?.lastError) {
    return (
      <div className="app-preview__container">
        <MessageBar messageBarType={MessageBarType.error} isMultiline={true}>
          <b className='app-preview__label'>Error</b>
          <pre className='app-preview__errors'>
            {status.lastError}
          </pre>
        </MessageBar>
      </div>
    );
  }

  return (
    <>
      {
        (
          isClean ? (
            <div className="app-preview__container">
              Press "Run" to compile program.
            </div>
          ) : (
            <XTerm
              ref={xtermRef}
              className='app-preview__terminal'
              options={{
                ...defaultTermConfig
              }}
              addons={[fitAddonRef.current]}
            />
          )
        )
      }
    </>
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
