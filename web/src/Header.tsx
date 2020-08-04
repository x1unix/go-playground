import React from 'react';
import './Header.css'
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar';
import { getTheme } from '@uifabric/styling';
import SettingsModal, {SettingsChanges} from './settings/SettingsModal';
import AboutModal from './AboutModal';
import config from './services/config';
import {
    Connect,
    newImportFileDispatcher,
    formatFileDispatcher,
    runFileDispatcher,
    saveFileDispatcher,
    dispatchToggleTheme,
    shareSnippetDispatcher,
    newBuildParamsChangeDispatcher,
    newMonacoParamsChangeDispatcher
} from './store';


interface HeaderState {
    showSettings: boolean
    showAbout: boolean
    loading: boolean
}

@Connect(s => ({darkMode: s.settings.darkMode, loading: s.status?.loading}))
export class Header extends React.Component<any, HeaderState> {
    private fileInput?: HTMLInputElement;

    constructor(props) {
        super(props);
        this.state = {
            showSettings: false,
            showAbout: false,
            loading: false
        };
    }

    componentDidMount(): void {
        const fileElement = document.createElement('input') as HTMLInputElement;
        fileElement.type = 'file';
        fileElement.accept = '.go';
        fileElement.addEventListener('change', () => this.onItemSelect(), false);
        this.fileInput = fileElement;
    }

    onItemSelect() {
        const file = this.fileInput?.files?.item(0);
        if (!file) {
            return;
        }

        this.props.dispatch(newImportFileDispatcher(file));
    }

    get menuItems(): ICommandBarItemProps[] {
        return [
            {
                key: 'openFile',
                text: 'Open',
                iconProps: {iconName: 'OpenFile'},
                disabled: this.props.loading,
                onClick: () => this.fileInput?.click(),
            },
            {
                key: 'run',
                text: 'Run',
                ariaLabel: 'Run',
                iconProps: {iconName: 'Play'},
                disabled: this.props.loading,
                onClick: () => {
                    this.props.dispatch(runFileDispatcher);
                }
            },
            {
                key: 'share',
                text: 'Share',
                iconProps: {iconName: 'Share'},
                disabled: this.props.loading,
                onClick: () => {
                    this.props.dispatch(shareSnippetDispatcher);
                }
            },
            {
                key: 'download',
                text: 'Download',
                iconProps: {iconName: 'Download'},
                disabled: this.props.loading,
                onClick: () => {
                    this.props.dispatch(saveFileDispatcher);
                },
            },
            {
                key: 'settings',
                text: 'Settings',
                ariaLabel: 'Settings',
                iconProps: {iconName: 'Settings'},
                disabled: this.props.loading,
                onClick: () => {
                    this.setState({showSettings: true});
                }
            }
        ];
    }

    get asideItems(): ICommandBarItemProps[] {
        return [
            {
                key: 'format',
                text: 'Format',
                ariaLabel: 'Format',
                iconOnly: true,
                disabled: this.props.loading,
                iconProps: {iconName: 'Code'},
                onClick: () => {
                    this.props.dispatch(formatFileDispatcher);
                }
            },
            {
                key: 'toggleTheme',
                text: 'Toggle Dark Mode',
                ariaLabel: 'Toggle Dark Mode',
                iconOnly: true,
                iconProps: {iconName: this.props.darkMode ? 'Brightness' : 'ClearNight'},
                onClick: () => {
                    this.props.dispatch(dispatchToggleTheme)
                },
            }
        ];
    }

    get overflowItems(): ICommandBarItemProps[] {
        return [
            {
                key: 'new-issue',
                text: 'Submit Issue',
                ariaLabel: 'Submit Issue',
                iconProps: {iconName: 'Bug'},
                onClick: () => window.open(config.issueUrl, '_blank')
            },
            {
                key: 'donate',
                text: 'Donate',
                ariaLabel: 'Donate',
                iconProps: {iconName: 'Heart'},
                onClick: () => window.open(config.donateUrl, '_blank')
            },
            {
                key: 'about',
                text: 'About',
                ariaLabel: 'About',
                iconProps: {iconName: 'Info'},
                onClick: () => {
                    this.setState({showAbout: true});
                }
            }
        ]
    }

    get styles() {
        // Apply the same colors as rest of Fabric components
        const theme = getTheme();
        return {
            backgroundColor: theme.palette.white
        }
    }

    private onSettingsClose(changes: SettingsChanges) {
        if (changes.monaco) {
            // Update monaco state if some of it's settings were changed
            this.props.dispatch(newMonacoParamsChangeDispatcher(changes.monaco));
        }

        if (changes.args) {
            // Save runtime settings
            const { runtime, autoFormat } = changes.args;
            this.props.dispatch(newBuildParamsChangeDispatcher(runtime, autoFormat));
        }

        this.setState({showSettings: false});
    }

    render() {
        return <header className='header' style={this.styles}>
            <img
                src='/go-logo-blue.svg'
                className='header__logo'
                alt='Golang Logo'
            />
            <CommandBar
                className='header__commandBar'
                items={this.menuItems}
                farItems={this.asideItems}
                overflowItems={this.overflowItems}
                ariaLabel='CodeEditor menu'
            />
            <SettingsModal onClose={(args) => this.onSettingsClose(args)} isOpen={this.state.showSettings} />
            <AboutModal onClose={() => this.setState({showAbout: false})} isOpen={this.state.showAbout} />
        </header>;
    }
}

