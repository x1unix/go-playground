import React from 'react'
import { Checkbox, Dropdown, type IPivotStyles, PivotItem, TextField } from '@fluentui/react'

import { AnimatedPivot } from '~/components/elements/tabs/AnimatedPivot'
import { ThemeableComponent } from '~/components/utils/ThemeableComponent'
import { Dialog } from '~/components/elements/modals/Dialog'
import { SettingsProperty } from './SettingsProperty'
import { DEFAULT_FONT } from '~/services/fonts'
import type { MonacoSettings } from '~/services/config'
import type { RenderingBackend, TerminalSettings } from '~/store/terminal'
import { connect, type StateDispatch, type MonacoParamsChanges, type SettingsState } from '~/store'

import { cursorBlinkOptions, cursorLineOptions, fontOptions, terminalBackendOptions } from './options'

export interface SettingsChanges {
  monaco?: MonacoParamsChanges
  settings?: Partial<SettingsState>
  terminal?: Partial<TerminalSettings>
}

interface OwnProps {
  isOpen?: boolean
  onClose: (changes: SettingsChanges) => void
}

interface StateProps {
  settings?: SettingsState
  monaco?: MonacoSettings
  terminal?: TerminalSettings
}

type Props = StateProps &
  OwnProps & {
    dispatch: StateDispatch
  }

interface SettingsModalState {
  isOpen?: boolean
}

const modalStyles = {
  main: {
    maxWidth: 480,
  },
}

const pivotStyles: Partial<IPivotStyles> = {
  itemContainer: {
    // Set height to highest of pivots. See: #371
    minHeight: 490,
  },
}

class SettingsModal extends ThemeableComponent<Props, SettingsModalState> {
  private changes: SettingsChanges = {}

  constructor(props) {
    super(props)
    this.state = {
      isOpen: props.isOpen,
    }
  }

  private onClose() {
    this.props.onClose({ ...this.changes })
    this.changes = {}
  }

  private touchMonacoProperty(key: keyof MonacoSettings, val: any) {
    if (!this.changes.monaco) {
      this.changes.monaco = {}
    }

    this.changes.monaco[key] = val
  }

  private touchSettingsProperty(changes: Partial<SettingsState>) {
    if (!this.changes.settings) {
      this.changes.settings = changes
      return
    }

    this.changes.settings = {
      ...this.changes.settings,
      ...changes,
    }
  }

  private touchTerminalSettings(changes: Partial<TerminalSettings>) {
    if (!this.changes.terminal) {
      this.changes.terminal = changes
      return
    }

    this.changes.terminal = {
      ...this.changes.terminal,
      ...changes,
    }
  }

  render() {
    const { isOpen } = this.props

    return (
      <Dialog label="Settings" onDismiss={() => this.onClose()} isOpen={isOpen} styles={modalStyles}>
        <AnimatedPivot aria-label="Settings" styles={pivotStyles}>
          <PivotItem itemKey="0" headerText="General">
            <SettingsProperty
              key="fontFamily"
              title="Font Family"
              description="Controls editor font family"
              control={
                <Dropdown
                  options={fontOptions}
                  defaultSelectedKey={this.props.monaco?.fontFamily ?? DEFAULT_FONT}
                  onChange={(_, num) => {
                    this.touchMonacoProperty('fontFamily', num?.key)
                  }}
                />
              }
            />
            <SettingsProperty
              key="minimap"
              title="Mini Map"
              control={
                <Checkbox
                  label="Enable mini map on side"
                  defaultChecked={this.props.monaco?.minimap}
                  onChange={(_, val) => {
                    this.touchMonacoProperty('minimap', val)
                  }}
                />
              }
            />
            <SettingsProperty
              key="autoDetectTheme"
              title="Use System Theme"
              control={
                <Checkbox
                  label="Follow system dark mode preference instead of manual toggle."
                  defaultChecked={this.props.settings?.useSystemTheme}
                  onChange={(_, val) => {
                    this.touchSettingsProperty({
                      useSystemTheme: val,
                    })
                  }}
                />
              }
            />
            <SettingsProperty
              key="fontLigatures"
              title="Font Ligatures"
              control={
                <Checkbox
                  label="Enable programming font ligatures in supported fonts"
                  defaultChecked={this.props.monaco?.fontLigatures}
                  onChange={(_, val) => {
                    this.touchMonacoProperty('fontLigatures', val)
                  }}
                />
              }
            />
            <SettingsProperty
              key="enableVimMode"
              title="Enable Vim Mode"
              control={
                <Checkbox
                  label="Allows usage of Vim key bindings when editing"
                  defaultChecked={this.props.settings?.enableVimMode}
                  onChange={(_, val) => {
                    this.touchSettingsProperty({ enableVimMode: val })
                  }}
                />
              }
            />
          </PivotItem>
          <PivotItem itemKey="1" headerText="Editor">
            <SettingsProperty
              key="cursorBlinking"
              title="Cursor Blinking"
              description="Set cursor animation style"
              control={
                <Dropdown
                  options={cursorBlinkOptions}
                  defaultSelectedKey={this.props.monaco?.cursorBlinking}
                  onChange={(_, num) => {
                    this.touchMonacoProperty('cursorBlinking', num?.key)
                  }}
                />
              }
            />
            <SettingsProperty
              key="cursorStyle"
              title="Cursor Style"
              description="Set the cursor style"
              control={
                <Dropdown
                  options={cursorLineOptions}
                  defaultSelectedKey={this.props.monaco?.cursorStyle}
                  onChange={(_, num) => {
                    this.touchMonacoProperty('cursorStyle', num?.key)
                  }}
                />
              }
            />
            <SettingsProperty
              key="selectOnLineNumbers"
              title="Select On Line Numbers"
              control={
                <Checkbox
                  label="Select corresponding line on line number click"
                  defaultChecked={this.props.monaco?.selectOnLineNumbers}
                  onChange={(_, val) => {
                    this.touchMonacoProperty('cursorStyle', val)
                  }}
                />
              }
            />
            <SettingsProperty
              key="contextMenu"
              title="Context Menu"
              control={
                <Checkbox
                  label="Enable editor context menu (on right click)"
                  defaultChecked={this.props.monaco?.contextMenu}
                  onChange={(_, val) => {
                    this.touchMonacoProperty('contextMenu', val)
                  }}
                />
              }
            />
            <SettingsProperty
              key="smoothScroll"
              title="Smooth Scrolling"
              control={
                <Checkbox
                  label="Enable that the editor animates scrolling to a position"
                  defaultChecked={this.props.monaco?.smoothScrolling}
                  onChange={(_, val) => {
                    this.touchMonacoProperty('smoothScrolling', val)
                  }}
                />
              }
            />
            <SettingsProperty
              key="mouseWheelZoom"
              title="Mouse Wheel Zoom"
              control={
                <Checkbox
                  label="Zoom the font in the editor when using the mouse wheel in combination with holding Ctrl"
                  defaultChecked={this.props.monaco?.mouseWheelZoom}
                  onChange={(_, val) => {
                    this.touchMonacoProperty('mouseWheelZoom', val)
                  }}
                />
              }
            />
          </PivotItem>
          <PivotItem itemKey="2" headerText="Terminal">
            <SettingsProperty
              title="Font Size"
              description="Controls the font size in pixels of the terminal."
              control={
                <TextField
                  type="number"
                  min={4}
                  max={128}
                  deferredValidationTime={0}
                  defaultValue={this.props.terminal?.fontSize.toString()}
                  onGetErrorMessage={(val) => {
                    const fontSize = Number(val)
                    if (isNaN(fontSize)) {
                      return 'Please enter a valid number'
                    }

                    if (fontSize < 4) {
                      return 'Please enter a number greater than 0'
                    }

                    this.touchTerminalSettings({ fontSize })
                  }}
                />
              }
            />
            <SettingsProperty
              key="terminalBackend"
              title="Rendering Backend"
              description="Set the rendering backend for the terminal."
              control={
                <Dropdown
                  options={terminalBackendOptions}
                  defaultSelectedKey={this.props.terminal?.renderingBackend}
                  onChange={(_, val) => {
                    this.touchTerminalSettings({
                      renderingBackend: val?.key.toString() as RenderingBackend,
                    })
                  }}
                />
              }
            />
          </PivotItem>
        </AnimatedPivot>
      </Dialog>
    )
  }
}

export const ConnectedSettingsModal = connect<StateProps, OwnProps>((state) => ({
  settings: state.settings,
  monaco: state.monaco,
  terminal: state.terminal.settings,
}))(SettingsModal)
