import React from 'react';
import {Modal, Dropdown, Checkbox, IDropdownOption, IconButton, getTheme} from 'office-ui-fabric-react';
import { Pivot, PivotItem } from 'office-ui-fabric-react/lib/Pivot';
import { getContentStyles, getIconButtonStyles } from '../styles/modal';
import SettingsProperty from './SettingsProperty';

const WASM_SUPPORTED = 'WebAssembly' in window;

const COMPILER_OPTIONS: IDropdownOption[] = [
    { key: 'GO_PLAYGROUND', text: 'Go Playground' },
    {
        key: 'WASM',
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

interface SettingsState {
    isOpen: boolean
}

export interface SettingsProps extends SettingsState {
    onClose: () => void
}

export default class SettingsModal extends React.Component<SettingsProps, SettingsState> {
    private titleID = 'Settings';
    private subtitleID = 'SettingsSubText';

    constructor(props) {
        super(props);
        console.log('SettingsModal.constructor');
        this.state = {
            isOpen: props.isOpen
        }
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
                onDismiss={this.props.onClose}
                containerClassName={contentStyles.container}
            >
                <div className={contentStyles.header}>
                    <span id={this.titleID}>Settings</span>
                    <IconButton
                        iconProps={{ iconName: 'Cancel' }}
                        styles={iconButtonStyles}
                        ariaLabel="Close popup modal"
                        onClick={this.props.onClose as any}
                    />
                </div>
                <div id={this.subtitleID}  className={contentStyles.body}>
                    <Pivot aria-label='Settings'>
                        <PivotItem headerText='Editor'>
                            <SettingsProperty
                                key='cursorBlinking'
                                title='Cursor Blinking'
                                description='Set cursor animation style'
                                control={<Dropdown options={CURSOR_BLINK_STYLE_OPTS} defaultSelectedKey='blink'/>}
                            />
                            <SettingsProperty
                                key='cursorStyle'
                                title='Cursor Style'
                                description='Set the cursor style'
                                control={<Dropdown options={CURSOR_LINE_OPTS} defaultSelectedKey='line'/>}
                            />
                            <SettingsProperty
                                key='selectOnLineNumbers'
                                title='Select On Line Numbers'
                                control={<Checkbox label="Select corresponding line on line number click" />}
                            />
                            <SettingsProperty
                                key='miniMap'
                                title='Mini Map'
                                control={<Checkbox label="Enable mini map on side" />}
                            />
                            <SettingsProperty
                                key='contextMenu'
                                title='Context Menu'
                                control={<Checkbox label="Enable editor context menu (on right click)" />}
                            />
                            <SettingsProperty
                                key='smoothScroll'
                                title='Smooth Scrolling'
                                control={<Checkbox label="Enable that the editor animates scrolling to a position" />}
                            />
                            <SettingsProperty
                                key='mouseWheelZoom'
                                title='Mouse Wheel Zoom'
                                control={<Checkbox label="Zoom the font in the editor when using the mouse wheel in combination with holding Ctrl" />}
                            />
                        </PivotItem>
                        <PivotItem headerText='Runtime' style={{paddingBottom: '64px'}}>
                            <SettingsProperty
                                key='compilerType'
                                title='Compiler'
                                description='This option lets you choose where your Go code should be executed.'
                                control={<Dropdown key='opts' options={COMPILER_OPTIONS} defaultSelectedKey='GO_PLAYGROUND'/>}
                            />
                            <SettingsProperty
                                key='autoFormat'
                                title='Auto Format'
                                control={<Checkbox label="Auto format code before build" />}
                            />
                        </PivotItem>
                    </Pivot>

                </div>
            </Modal>
        )
    }
}