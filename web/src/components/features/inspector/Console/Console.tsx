import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import copy from 'copy-to-clipboard'

import { DefaultButton, useTheme } from '@fluentui/react'

import type { ITerminalAddon, ITerminalOptions } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { ImageAddon } from '@xterm/addon-image'
import { CanvasAddon } from '@xterm/addon-canvas'
import { WebglAddon } from '@xterm/addon-webgl'

import type { StatusState } from '~/store'
import { RenderingBackend } from '~/store/terminal'
import { useXtermTheme, XTerm } from '~/components/utils/XTerm'

import { formatEvalEvent } from './format'
import { createDebounceResizeObserver } from './utils'

import './Console.css'

const RESIZE_DELAY = 50

const imageAddonConfig = {
  enableSizeReports: true,
  sixelSupport: true,
  sixelScrolling: true,
  iipSupport: true,
}

const config: ITerminalOptions = {
  convertEol: true,
}

export interface ConsoleProps {
  status?: StatusState
  fontFamily: string
  fontSize: number
  backend: RenderingBackend
}

const getAddonFromBackend = (backend: RenderingBackend): ITerminalAddon | null => {
  switch (backend) {
    case RenderingBackend.WebGL:
      return new WebglAddon()
    case RenderingBackend.Canvas:
      return new CanvasAddon()
    default:
      return null
  }
}

const CopyButton: React.FC<{
  onClick?: () => void
  hidden?: boolean
}> = ({ onClick, hidden }) => {
  const theme = useTheme()
  const styles = useMemo(
    () => ({
      root: {
        color: theme?.palette.neutralPrimary,
        marginLeft: 'auto',
        marginTop: '4px',
        marginRight: '2px',
        padding: '4px 8px',
        minWidth: 'initial',
      },
      rootHovered: {
        color: theme?.palette.neutralDark,
      },
    }),
    [theme],
  )
  return (
    <DefaultButton
      className="app-Console__copy"
      iconProps={{ iconName: 'Copy' }}
      ariaLabel="Copy"
      onClick={onClick}
      styles={styles}
      hidden={hidden}
    />
  )
}

/**
 * Console is Go program events output component based on xterm.js
 */
export const Console: React.FC<ConsoleProps> = ({ fontFamily, fontSize, status, backend }) => {
  const theme = useXtermTheme()
  const [offset, setOffset] = useState(0)
  const [isFocused, setIsFocused] = useState(false)

  const xtermRef = useRef<XTerm>(null)
  const fitAddonRef = useRef(new FitAddon())
  const imageAddonRef = useRef(new ImageAddon(imageAddonConfig))

  const resizeObserver = useMemo(
    () =>
      createDebounceResizeObserver(() => {
        fitAddonRef.current.fit()
      }, RESIZE_DELAY),
    [fitAddonRef],
  )

  const isClean = !status?.dirty
  const events = status?.events
  const terminal = xtermRef.current?.terminal
  const elemRef = xtermRef?.current?.terminalRef

  const copySelection = useCallback(() => {
    if (!terminal) {
      return
    }

    const shouldTrim = !terminal.hasSelection()
    if (!terminal.hasSelection()) {
      terminal.selectAll()
    }

    const str = terminal.getSelection()
    terminal.clearSelection()

    // TODO: notify about copy result
    copy(shouldTrim ? str.trim() : str)
  }, [terminal])

  // Track output events
  useEffect(() => {
    if (!events?.length || !terminal) {
      setOffset(0)
      terminal?.clear()
      terminal?.reset()
      return
    }

    if (offset === 0) {
      terminal?.clear()
      terminal?.reset()
    }

    const batch = events?.slice(offset)
    if (!batch) {
      return
    }

    batch.map(formatEvalEvent).forEach((msg) => {
      terminal?.write(msg)
    })
    terminal?.scrollToBottom()
    setOffset(offset + batch.length)
  }, [terminal, offset, events])

  // Reset output offset on clean
  useEffect(() => {
    if (isClean) {
      setOffset(0)
    }
  }, [isClean])

  // Track terminal resize
  useEffect(() => {
    if (!elemRef?.current) {
      resizeObserver.disconnect()
      return
    }

    resizeObserver.observe(elemRef.current)
    return () => {
      resizeObserver.disconnect()
    }
  }, [elemRef, resizeObserver])

  // Theme
  useEffect(() => {
    if (!terminal) {
      return
    }

    terminal.options = {
      theme,
      fontSize,
      fontFamily,
    }
    fitAddonRef.current.fit()
  }, [theme, terminal, fitAddonRef, fontFamily, fontSize])

  // Rendering backend
  useEffect(() => {
    if (!terminal) {
      return
    }

    console.log('xterm: switched backend:', backend)
    const addon = getAddonFromBackend(backend)
    if (!addon) {
      return
    }

    terminal.loadAddon(addon)
    return () => {
      console.log('xterm: unloading old backend:', backend)
      addon.dispose()
    }
  }, [terminal, backend])

  // Register button on focus
  useEffect(() => {
    if (!terminal?.textarea) {
      return
    }

    terminal.textarea.addEventListener('focus', () => {
      setIsFocused(true)
    })

    terminal.textarea.addEventListener('blur', () => {
      // Delay before blur to keep enough time for btn click
      setTimeout(() => {
        setIsFocused(false)
      }, 150)
    })

    return () => {
      setIsFocused(false)
    }
  }, [terminal?.textarea, setIsFocused])

  return (
    <div className="app-Console" style={{ '--terminal-bg': theme.background } as any}>
      <CopyButton hidden={!isFocused} onClick={copySelection} />
      <XTerm
        ref={xtermRef}
        className="app-Console__xterm"
        addons={[fitAddonRef.current, imageAddonRef.current]}
        options={{
          ...config,
          theme,
          fontSize,
          fontFamily,
        }}
      />
    </div>
  )
}
