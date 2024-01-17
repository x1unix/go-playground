import React from 'react';
import {
  Checkbox,
  TextField,
  Dropdown,
  IconButton,
  IDropdownOption,
  Modal,
  Stack
} from '@fluentui/react';
import {Pivot, PivotItem} from '@fluentui/react/lib/Pivot';

import ThemeableComponent from '~/components/utils/ThemeableComponent';
import {getContentStyles, getIconButtonStyles} from '~/styles/modal';
import SettingsProperty from './SettingsProperty';
import {MonacoSettings} from '~/services/config';
import {DEFAULT_FONT, getAvailableFonts} from '~/services/fonts';
import {
  Connect,
  MonacoParamsChanges,
  SettingsState
} from '~/store';

const CURSOR_BLINK_STYLE_OPTS: IDropdownOption[] = [
  { key: 'blink', text: 'Blink (default)' },
  { key: 'smooth', text: 'Smooth' },
  { key: 'phase', text: 'Phase' },
  { key: 'expand', text: 'Expand' },
  { key: 'solid', text: 'Solid' },
];

const CURSOR_LINE_OPTS: IDropdownOption[] = [
  { key: 'line', text: 'Line (default)' },
  { key: 'block', text: 'Block' },
  { key: 'underline', text: 'Underline' },
  { key: 'line-thin', text: 'Line thin' },
  { key: 'block-outline', text: 'Block outline' },
  { key: 'underline-thin', text: 'Underline thin' },
];

const FONT_OPTS: IDropdownOption[] = [
  { key: DEFAULT_FONT, text: 'System default' },
  ...getAvailableFonts().map(f => ({
    key: f.family,
    text: f.label,
  }))
];

export interface SettingsChanges {
  monaco?: MonacoParamsChanges
  settings?: Partial<SettingsState>
}

export interface SettingsProps {
  isOpen?: boolean
  onClose: (changes: SettingsChanges) => void
  settings?: SettingsState
  monaco?: MonacoSettings
  dispatch?: (action) => void
}

interface SettingsModalState {
  isOpen?: boolean
}

@Connect(state => ({
  settings: state.settings,
  monaco: state.monaco,
}))
export default class SettingsModal extends ThemeableComponent<SettingsProps, SettingsModalState> {
  private titleID = 'Settings';
  private subtitleID = 'SettingsSubText';
  private changes: SettingsChanges = {};

  constructor(props) {
    super(props);
    this.state = {
      isOpen: props.isOpen,
    }
  }

  private onClose() {
    this.props.onClose({ ...this.changes });
    this.changes = {};
  }

  private touchMonacoProperty(key: keyof MonacoSettings, val: any) {
    if (!this.changes.monaco) {
      this.changes.monaco = {};
    }

    this.changes.monaco[key] = val;
  }

  private touchSettingsProperty(changes: Partial<SettingsState>) {
    if (!this.changes.settings) {
      this.changes.settings = changes;
      return;
    }

    this.changes.settings = {
      ...this.changes.settings,
      ...changes,
    };
  }

  render() {
    const contentStyles = getContentStyles(this.theme);
    const iconButtonStyles = getIconButtonStyles(this.theme);
    return (
      <Modal
        titleAriaId={this.titleID}
        subtitleAriaId={this.subtitleID}
        isOpen={this.props.isOpen}
        onDismiss={() => this.onClose()}
        containerClassName={contentStyles.container}
      >
        <div className={contentStyles.header}>
          <span id={this.titleID}>Settings</span>
          <IconButton
            iconProps={{ iconName: 'Cancel' }}
            styles={iconButtonStyles}
            ariaLabel="Close popup modal"
            onClick={() => this.onClose()}
          />
        </div>
        <div id={this.subtitleID} className={contentStyles.body}>
          <Pivot aria-label='Settings'>
            <PivotItem headerText='General'>
              <SettingsProperty
                key='fontFamily'
                title='Font Family'
                description='Controls editor font family'
                control={(
                  <Dropdown
                    options={FONT_OPTS}
                    defaultSelectedKey={this.props.monaco?.fontFamily ?? DEFAULT_FONT}
                    onChange={(_, num) => {
                      this.touchMonacoProperty('fontFamily', num?.key);
                    }}
                  />
                )}
              />
              <SettingsProperty
                key='minimap'
                title='Mini Map'
                control={(
                  <Checkbox
                    label="Enable mini map on side"
                    defaultChecked={this.props.monaco?.minimap}
                    onChange={(_, val) => {
                      this.touchMonacoProperty('minimap', val);
                    }}
                  />
                )}
              />
              <SettingsProperty
                key='autoDetectTheme'
                title='Use System Theme'
                control={(
                  <Checkbox
                    label='Follow system dark mode preference instead of manual toggle.'
                    defaultChecked={this.props.settings?.useSystemTheme}
                    onChange={(_, val) => {
                      this.touchSettingsProperty({
                        useSystemTheme: val
                      });
                    }}
                  />
                )}
              />
              <SettingsProperty
                key='fontLigatures'
                title='Font Ligatures'
                control={(
                  <Checkbox
                    label='Enable programming font ligatures in supported fonts'
                    defaultChecked={this.props.monaco?.fontLigatures}
                    onChange={(_, val) => {
                      this.touchMonacoProperty('fontLigatures', val);
                    }}
                  />
                )}
              />
              <SettingsProperty
                key='enableVimMode'
                title='Enable Vim Mode'
                control={(
                  <Checkbox
                    label='Allows usage of Vim key bindings when editing'
                    defaultChecked={this.props.settings?.enableVimMode}
                    onChange={(_, val) => {
                      this.touchSettingsProperty({enableVimMode: val})
                    }}
                  />
                )}
              />
            </PivotItem>
            <PivotItem headerText='Editor'>
              <SettingsProperty
                key='cursorBlinking'
                title='Cursor Blinking'
                description='Set cursor animation style'
                control={(
                  <Dropdown
                    options={CURSOR_BLINK_STYLE_OPTS}
                    defaultSelectedKey={this.props.monaco?.cursorBlinking}
                    onChange={(_, num) => {
                      this.touchMonacoProperty('cursorBlinking', num?.key);
                    }}
                  />
                )}
              />
              <SettingsProperty
                key='cursorStyle'
                title='Cursor Style'
                description='Set the cursor style'
                control={(
                  <Dropdown
                    options={CURSOR_LINE_OPTS}
                    defaultSelectedKey={this.props.monaco?.cursorStyle}
                    onChange={(_, num) => {
                      this.touchMonacoProperty('cursorStyle', num?.key);
                    }}
                  />
                )}
              />
              <SettingsProperty
                key='selectOnLineNumbers'
                title='Select On Line Numbers'
                control={(
                  <Checkbox
                    label="Select corresponding line on line number click"
                    defaultChecked={this.props.monaco?.selectOnLineNumbers}
                    onChange={(_, val) => {
                      this.touchMonacoProperty('cursorStyle', val);
                    }}
                  />
                )}
              />
              <SettingsProperty
                key='contextMenu'
                title='Context Menu'
                control={(
                  <Checkbox
                    label="Enable editor context menu (on right click)"
                    defaultChecked={this.props.monaco?.contextMenu}
                    onChange={(_, val) => {
                      this.touchMonacoProperty('contextMenu', val);
                    }}
                  />
                )}
              />
              <SettingsProperty
                key='smoothScroll'
                title='Smooth Scrolling'
                control={(
                  <Checkbox
                    label="Enable that the editor animates scrolling to a position"
                    defaultChecked={this.props.monaco?.smoothScrolling}
                    onChange={(_, val) => {
                      this.touchMonacoProperty('smoothScrolling', val);
                    }}
                  />
                )}
              />
              <SettingsProperty
                key='mouseWheelZoom'
                title='Mouse Wheel Zoom'
                control={(
                  <Checkbox
                    label="Zoom the font in the editor when using the mouse wheel in combination with holding Ctrl"
                    defaultChecked={this.props.monaco?.mouseWheelZoom}
                    onChange={(_, val) => {
                      this.touchMonacoProperty('mouseWheelZoom', val);
                    }}
                  />
                )}
              />
            </PivotItem>
            <PivotItem headerText='Terminal'>
              <SettingsProperty
                key='emulateTerminal'
                title='Enable Terminal Emulation'
                control={(
                  <Checkbox
                    onRenderLabel={() => (
                      <Stack style={{marginLeft: 4}}>
                        <span>Enables colored output and terminal sequences support.</span>
                        <span>
                          Text selection <a href="https://github.com/xtermjs/xterm.js/issues/1291" target="_blank" rel="noreferrer">doesn't work</a> on mobile devices.
                        </span>
                      </Stack>
                    )}
                  />
                )}
              />
              <SettingsProperty
                title='Font Size'
                description='Controls the font size in pixels of the terminal.'
                control={(
                  <TextField
                    type='number'
                    min={1}
                    max={128}
                    // value={this.props.monaco?.fontSize}
                    onChange={(_, val) => {
                      // this.touchMonacoProperty('fontSize', val);
                    }}
                  />
                )}
              />
              <SettingsProperty
                key='terminalBackend'
                title='Rendering Backend'
                description='Set the rendering backend for the terminal.'
                control={(
                  <Dropdown
                    options={[
                      { key: 'canvas', text: 'Canvas (default)' },
                      { key: 'dom', text: 'DOM' },
                      { key: 'webgl', text: 'WebGL (experimental)' },
                    ]}
                  />
                )}
              />
            </PivotItem>
          </Pivot>

        </div>
      </Modal>
    )
  }
}
