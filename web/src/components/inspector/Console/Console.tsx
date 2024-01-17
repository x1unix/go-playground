import React, { useMemo, useEffect, useState, useRef } from 'react';
import type { ITerminalOptions, ITerminalAddon } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { ImageAddon } from '@xterm/addon-image';
import { CanvasAddon } from '@xterm/addon-canvas';

import type { StatusState } from '~/store';
import { useXtermTheme, XTerm } from '~/components/utils/XTerm';

import { formatEvalEvent } from './format';
import { createDebounceResizeObserver } from './utils';

import './Console.css';

const RESIZE_DELAY = 50;
const config: ITerminalOptions = {
  convertEol: true,
};

interface Props {
  status?: StatusState
  fontFamily: string
  fontSize: number
}

/**
 * Console is Go program events output component based on xterm.js
 */
export const Console: React.FC<Props> = ({fontFamily, fontSize, status}) => {
  const theme = useXtermTheme();
  const [offset, setOffset] = useState(0);

  const xtermRef = useRef<XTerm>(null);
  const fitAddonRef = useRef(new FitAddon());
  const resizeObserver = useMemo(() => (
    createDebounceResizeObserver(() => {
      fitAddonRef.current.fit();
    }, RESIZE_DELAY)
  ), [fitAddonRef]);

  const addons = useMemo<ITerminalAddon[]>(
    () => [
      fitAddonRef.current,
      new CanvasAddon(),
      new ImageAddon({
        enableSizeReports: true,
        sixelSupport: true,
        sixelScrolling: true,
        iipSupport: true,
      })
    ],
    [fitAddonRef]
  );

  const isClean = !status?.dirty;
  const events = status?.events;
  const terminal = xtermRef.current?.terminal;
  const elemRef = xtermRef?.current?.terminalRef;

  // Track output events
  useEffect(() => {
    if (!events?.length || !terminal) {
      setOffset(0);
      terminal?.clear();
      terminal?.reset();
      return;
    }

    if (offset === 0) {
      terminal?.clear();
      terminal?.reset();
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
    if (!elemRef?.current) {
      resizeObserver.disconnect();
      return;
    }

    resizeObserver.observe(elemRef.current);
    return () => {
      resizeObserver.disconnect();
    }
  }, [elemRef, resizeObserver]);

  // Theme
  useEffect(() => {
    if (!terminal) {
      return;
    }

    terminal.options = {
      theme,
      fontFamily,
    };
  }, [theme, terminal, fontFamily]);

  return (
    <div className="app-Console">
      <XTerm
        ref={xtermRef}
        className='app-Console__xterm'
        addons={addons}
        options={{
          ...config,
          theme,
          fontSize,
          fontFamily,
        }}
      />
    </div>
  );
}
