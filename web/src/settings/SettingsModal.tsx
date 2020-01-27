import React from 'react';
import {Checkbox, Dropdown, getTheme, IconButton, IDropdownOption, Modal} from 'office-ui-fabric-react';
import {Pivot, PivotItem} from 'office-ui-fabric-react/lib/Pivot';
import {MessageBar, MessageBarType} from 'office-ui-fabric-react/lib/MessageBar';
import {Link} from 'office-ui-fabric-react/lib/Link';
import {getContentStyles, getIconButtonStyles} from '../styles/modal';
import SettingsProperty from './SettingsProperty';
import {MonacoSettings, RuntimeType} from '../services/config';
import {BuildParamsArgs, Connect, MonacoParamsChanges, SettingsState} from "../store";

const WASM_SUPPORTED = 'WebAssembly' in window;

const COMPILER_OPTIONS: IDropdownOption[] = [
    { key: RuntimeType.GoPlayground, text: 'Go Playground' },
    {
        key: RuntimeType.WebAssembly,
        text: `WebAssembly (${WASM_SUPPORTED ? 'Experimental' : 'Unsupported'})`,
        disabled: !WASM_SUPPORTED
    },
];

const CURSOR_BLINK_STYLE_OPTS: IDropdownOption[] = [
    {key: 'blink', text: 'Blink (default)'},
    {key: 'smooth', text: 'Smooth'},
    {key: 'phase', text: 'Phase'},
    {key: 'expand', text: 'Expand'},
    {key: 'solid', text: 'Solid'},
];

const CURSOR_LINE_OPTS: IDropdownOption[] = [
    {key: 'line', text: 'Line (default)'},
    {key: 'block', text: 'Block'},
    {key: 'underline', text: 'Underline'},
    {key: 'line-thin', text: 'Line thin'},
    {key: 'block-outline', text: 'Block outline'},
    {key: 'underline-thin', text: 'Underline thin'},
];

export interface SettingsChanges {
    monaco?: MonacoParamsChanges
    args?: BuildParamsArgs,
}

export interface SettingsProps {
    isOpen: boolean
    onClose: (changes: SettingsChanges) => void
    settings?: SettingsState
    monaco?: MonacoSettings
    dispatch?: (Action) => void
}

@Connect(state => ({
    settings: state.settings,
    monaco: state.monaco,
}))
export default class SettingsModal extends React.Component<SettingsProps, {isOpen: boolean, showWarning: boolean}> {
    private titleID = 'Settings';
    private subtitleID = 'SettingsSubText';
    private changes: SettingsChanges = {};

    constructor(props) {
        super(props);
        this.state = {
            isOpen: props.isOpen,
            showWarning: props.settings.runtime === RuntimeType.WebAssembly,
        }
    }

    private onClose() {
        this.props.onClose({...this.changes});
        this.changes = {};
    }

    private touchMonacoProperty(key: keyof MonacoSettings, val: any) {
        if (!this.changes.monaco) {
            this.changes.monaco = {};
        }

        this.changes.monaco[key] = val;
    }

    get wasmWarningVisibility() {
        return this.state.showWarning ? 'visible' : 'hidden'
    }

    render() {
        const theme = getTheme();
        const contentStyles = getContentStyles(theme);
        const iconButtonStyles = getIconButtonStyles(theme);
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
                <div id={this.subtitleID}  className={contentStyles.body}>
                    <Pivot aria-label='Settings'>
                        <PivotItem headerText='Editor'>
                            <SettingsProperty
                                key='cursorBlinking'
                                title='Cursor Blinking'
                                description='Set cursor animation style'
                                control={<Dropdown
                                    options={CURSOR_BLINK_STYLE_OPTS}
                                    defaultSelectedKey={this.props.monaco?.cursorBlinking}
                                    onChange={(_, num) => {
                                        this.touchMonacoProperty('cursorBlinking', num?.key);
                                    }}
                                />}
                            />
                            <SettingsProperty
                                key='cursorStyle'
                                title='Cursor Style'
                                description='Set the cursor style'
                                control={<Dropdown
                                    options={CURSOR_LINE_OPTS}
                                    defaultSelectedKey={this.props.monaco?.cursorStyle}
                                    onChange={(_, num) => {
                                        this.touchMonacoProperty('cursorStyle', num?.key);
                                    }}
                                />}
                            />
                            <SettingsProperty
                                key='selectOnLineNumbers'
                                title='Select On Line Numbers'
                                control={<Checkbox
                                    label="Select corresponding line on line number click"
                                    defaultChecked={this.props.monaco?.selectOnLineNumbers}
                                    onChange={(_, val) => {
                                        this.touchMonacoProperty('cursorStyle', val);
                                    }}
                                />}
                            />
                            <SettingsProperty
                                key='minimap'
                                title='Mini Map'
                                control={<Checkbox
                                    label="Enable mini map on side"
                                    defaultChecked={this.props.monaco?.minimap}
                                    onChange={(_, val) => {
                                        this.touchMonacoProperty('minimap', val);
                                    }}
                                />}
                            />
                            <SettingsProperty
                                key='contextMenu'
                                title='Context Menu'
                                control={<Checkbox
                                    label="Enable editor context menu (on right click)"
                                    defaultChecked={this.props.monaco?.contextMenu}
                                    onChange={(_, val) => {
                                        this.touchMonacoProperty('contextMenu', val);
                                    }}
                                />}
                            />
                            <SettingsProperty
                                key='smoothScroll'
                                title='Smooth Scrolling'
                                control={<Checkbox
                                    label="Enable that the editor animates scrolling to a position"
                                    defaultChecked={this.props.monaco?.smoothScrolling}
                                    onChange={(_, val) => {
                                        this.touchMonacoProperty('smoothScrolling', val);
                                    }}
                                />}
                            />
                            <SettingsProperty
                                key='mouseWheelZoom'
                                title='Mouse Wheel Zoom'
                                control={<Checkbox
                                    label="Zoom the font in the editor when using the mouse wheel in combination with holding Ctrl"
                                    defaultChecked={this.props.monaco?.mouseWheelZoom}
                                    onChange={(_, val) => {
                                        this.touchMonacoProperty('mouseWheelZoom', val);
                                    }}
                                />}
                            />
                        </PivotItem>
                        <PivotItem headerText='Build' style={{paddingBottom: '64px'}}>
                            <SettingsProperty
                                key='runtime'
                                title='Runtime'
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

                                        this.setState({showWarning: val?.key === RuntimeType.WebAssembly});
                                    }}
                                />}
                            />
                            <div style={{visibility: this.wasmWarningVisibility, marginTop: '10px'}}>
                                <MessageBar isMultiline={true} messageBarType={MessageBarType.warning}>
                                    <b>WebAssembly</b> is a modern runtime that gives you additional features
                                    like possibility to interact with web browser but is unstable.
                                    Use it at your own risk.
                                    <p>
                                        See<Link href='https://github.com/golang/go/wiki/WebAssembly' target='_blank'>documentation</Link> for more details.
                                    </p>
                                </MessageBar>
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
                    </Pivot>

                </div>
            </Modal>
        )
    }
}