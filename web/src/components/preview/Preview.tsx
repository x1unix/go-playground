import React, {useMemo, useEffect, useState, useRef} from 'react';
import {MessageBar, MessageBarType, useTheme} from '@fluentui/react';

import { ITerminalOptions } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { ImageAddon } from '@xterm/addon-image';
import { CanvasAddon } from '@xterm/addon-canvas';

import {getDefaultFontFamily} from '~/services/fonts';
import {connect, StatusState} from '~/store';

import {buildXtermTheme, XTerm} from '~/components/utils/XTerm';
import { formatEvalEvent, createDebounceResizeObserver } from './utils';

import './Preview.css';

interface OwnProps {}

interface StateProps {
  status?: StatusState
}

interface PreviewContentProps {
  status?: StatusState
}

const RESIZE_DELAY = 50;

const defaultTermConfig: ITerminalOptions = {
  convertEol: true,
  fontSize: 13,
};

const PreviewContent: React.FC<PreviewContentProps> = ({status}) => {
  const theme = useTheme();
  const [offset, setOffset] = useState(0);

  // Xterm
  const xtermTheme = useMemo(() => buildXtermTheme(theme), [theme]);
  const xtermRef = useRef<XTerm>(null);
  const fitAddonRef = useRef(new FitAddon());
  const resizeObserver = useMemo(() => (
   createDebounceResizeObserver(() => fitAddonRef.current.fit(), RESIZE_DELAY)
  ), [fitAddonRef]);
  const addons = useMemo(() => [
    fitAddonRef.current,
    new CanvasAddon(),
    new ImageAddon({
      enableSizeReports: true,    // whether to enable CSI t reports (see below)
      pixelLimit: 16777216,       // max. pixel size of a single image
      sixelSupport: true,         // enable sixel support
      sixelScrolling: true,       // whether to scroll on image output
      sixelPaletteLimit: 256,     // initial sixel palette size
      sixelSizeLimit: 25000000,   // size limit of a single sixel sequence
      storageLimit: 128,          // FIFO storage limit in MB
      showPlaceholder: true,      // whether to show a placeholder for evicted images
      iipSupport: true,           // enable iTerm IIP support
      iipSizeLimit: 20000000      // size limit of a single IIP sequence
    }),
  ], [fitAddonRef]);

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
    if (!terminal?.element) {
      resizeObserver.disconnect();
      return;
    }

    resizeObserver.observe(terminal.element);
    return () => {
      resizeObserver.disconnect();
    }
  }, [terminal, resizeObserver])

  // Theme
  useEffect(() => {
    if (!terminal) {
      return;
    }

    terminal.options = { theme: xtermTheme };
  }, [xtermTheme, terminal]);

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
              addons={addons}
              options={{
                ...defaultTermConfig,
                theme: xtermTheme,
              }}
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
    // console.log(JSON.stringify(palette));
    // console.log(JSON.stringify(theme.semanticColors));
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
