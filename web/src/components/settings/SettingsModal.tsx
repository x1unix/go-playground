import React from 'react';
import {
  Checkbox,
  Dropdown,
  IconButton,
  IDropdownOption,
  Modal
} from '@fluentui/react';
import {Pivot, PivotItem} from '@fluentui/react/lib/Pivot';
import {MessageBar, MessageBarType} from '@fluentui/react/lib/MessageBar';
import {Link} from '@fluentui/react/lib/Link';

import ThemeableComponent from '@components/utils/ThemeableComponent';
import {getContentStyles, getIconButtonStyles} from '~/styles/modal';
import SettingsProperty from './SettingsProperty';
import {MonacoSettings, RuntimeType} from '~/services/config';
import {DEFAULT_FONT, getAvailableFonts} from '~/services/fonts';
import {
  BuildParamsArgs,
  Connect,
  MonacoParamsChanges,
  SettingsState
} from '~/store';

const WASM_SUPPORTED = 'WebAssembly' in window;

const COMPILER_OPTIONS: IDropdownOption[] = [
  { key: RuntimeType.GoPlayground, text: 'Go Playground' },
  {
    key: RuntimeType.GoTipPlayground, text: 'Go Playground (Go Tip)' },
  {
    key: RuntimeType.WebAssembly,
    text: `WebAssembly - Compiler ${WASM_SUPPORTED ? '' : '(Unsupported)'}`,
    disabled: !WASM_SUPPORTED
  },
  {
    key: RuntimeType.Interpreter,
    text: `WebAssembly - Interpreter (${WASM_SUPPORTED ? 'Experimental' : 'Unsupported'})`,
    disabled: !WASM_SUPPORTED
  }
];

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

const runtimeTypeWarnings: {[k in RuntimeType]: (React.ReactElement | null)} = ({
  [RuntimeType.GoTipPlayground]: (
    <MessageBar isMultiline={true} messageBarType={MessageBarType.info}>
      <b>Gotip Playground</b> option uses the official Go Playground server with latest unstable Go version.
      <p>
        See<Link href='https://pkg.go.dev/golang.org/dl/gotip' target='_blank'>gotip help</Link> for more details.
      </p>
    </MessageBar>
  ),
  [RuntimeType.GoPlayground]: (
    <MessageBar isMultiline={true} messageBarType={MessageBarType.info}>
      <b>Go Playground</b> option uses the official Go Playground server to run a program.
    </MessageBar>
  ),
  [RuntimeType.WebAssembly]: (
    <MessageBar isMultiline={true} messageBarType={MessageBarType.info}>
      <b>WebAssembly Compiler</b>
      <span> option uses API server to build Go program as WebAssembly executable.</span>
      <p>
        Program is still compiled on the server but execution is performed inside a browser.
      </p>
      <p>
        Unlike Go playground server, this option provides a real concurrency and access to system date time.
      </p>
      <p>
        See<Link href='https://github.com/golang/go/wiki/WebAssembly' target='_blank'>documentation</Link> for more details.
      </p>
    </MessageBar>
  ),
  [RuntimeType.Interpreter]: (
    <MessageBar isMultiline={true} messageBarType={MessageBarType.warning}>
      <b>WebAssembly Interpreter</b>
      <span> compiles and runs Go code inside the browser using </span>
      <Link href='https://github.com/traefik/yaegi' target='_blank'>Yaegi</Link> Go interpreter.
      <p>
        This mode allows to run code in without <u>internet</u>, but is very unstable. Use at your own risk.
      </p>
    </MessageBar>
  )
})

export interface SettingsChanges {
  monaco?: MonacoParamsChanges
  args?: BuildParamsArgs,
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
  isOpen?: boolean,
  selectedRuntime: RuntimeType
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
      selectedRuntime: props.settings.runtime,
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
    const { selectedRuntime } = this.state;
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
            <PivotItem headerText='Editor'>
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
            <PivotItem headerText='Go Environment' style={{ paddingBottom: '64px' }}>
              <SettingsProperty
                key='runtime'
                title='Environment'
                description='This option lets you choose where your Go code should be executed.'
                control={<Dropdown
                  options={COMPILER_OPTIONS}
                  defaultSelectedKey={this.props.settings?.runtime}
                  onChange={(_, val) => {
                    if (!val) {
                      return;
                    }
                    this.changes.args = {
                      runtime: val?.key as RuntimeType,
                      autoFormat: this.props.settings?.autoFormat ?? true,
                    };

                    this.setState({
                      selectedRuntime: val?.key as RuntimeType,
                    });
                  }}
                />}
              />
              <div style={{ marginTop: '10px' }}>
                { runtimeTypeWarnings[selectedRuntime] }
              </div>
              <SettingsProperty
                key='autoFormat'
                title='Auto Format'
                control={<Checkbox
                  label="Auto format code before build"
                  defaultChecked={this.props.settings?.autoFormat}
                  onChange={(_, val) => {
                    this.changes.args = {
                      autoFormat: val ?? false,
                      runtime: this.props.settings?.runtime ?? RuntimeType.GoPlayground,
                    };
                  }}
                />}
              />
            </PivotItem>
            <PivotItem headerText='Advanced'>
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
          </Pivot>

        </div>
      </Modal>
    )
  }
}
