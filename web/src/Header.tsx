import React from 'react';
import './Header.css'
import { MessageBarButton } from 'office-ui-fabric-react';
import {CommandBar, ICommandBarItemProps} from 'office-ui-fabric-react/lib/CommandBar';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react/lib/MessageBar';
import {getTheme} from '@uifabric/styling';
import SettingsModal, {SettingsChanges} from './settings/SettingsModal';
import AboutModal from './AboutModal';
import config from './services/config';
import api from './services/api';
import { getSnippetsMenuItems, SnippetMenuItem } from './utils/headerutils';
import {
    Connect,
    dispatchToggleTheme,
    formatFileDispatcher,
    newBuildParamsChangeDispatcher, newCodeImportDispatcher,
    newImportFileDispatcher,
    newMonacoParamsChangeDispatcher, newSnippetLoadDispatcher,
    runFileDispatcher,
    saveFileDispatcher,
    shareSnippetDispatcher
} from './store';
import ChangeLogModal from "./ChangeLogModal";

interface HeaderState {
    showSettings: boolean
    showAbout: boolean
    showChangelog: boolean
    loading: boolean
    showUpdateBanner: boolean
}

@Connect(s => ({darkMode: s.settings.darkMode, loading: s.status?.loading}))
export class Header extends React.Component<any, HeaderState> {
    private fileInput?: HTMLInputElement;
    private snippetMenuItems = getSnippetsMenuItems(i => this.onSnippetMenuItemClick(i));

    constructor(props) {
        super(props);
        this.state = {
            showSettings: false,
            showAbout: false,
            showChangelog: false,
            loading: false,
            showUpdateBanner: false
        };
    }

    componentDidMount(): void {
        const fileElement = document.createElement('input') as HTMLInputElement;
        fileElement.type = 'file';
        fileElement.accept = '.go';
        fileElement.addEventListener('change', () => this.onItemSelect(), false);
        this.fileInput = fileElement;

        // show update popover
        api.getVersion().then(r => {
            const {version} = r;
            if (!version) return;
            this.setState({showUpdateBanner: version !== config.appVersion});
        }).catch(err => console.warn('failed to check server API version: ', err));
    }

    onItemSelect() {
        const file = this.fileInput?.files?.item(0);
        if (!file) {
            return;
        }

        this.props.dispatch(newImportFileDispatcher(file));
    }

    onSnippetMenuItemClick(item: SnippetMenuItem) {
        const dispatcher = item.snippet ? newSnippetLoadDispatcher(item.snippet) : newCodeImportDispatcher(item.label, item.text as string);
        this.props.dispatch(dispatcher);
    }

    get menuItems(): ICommandBarItemProps[] {
        return [
            {
                key: 'openFile',
                text: 'Open',
                split: true,
                iconProps: {iconName: 'OpenFile'},
                disabled: this.props.loading,
                onClick: () => this.fileInput?.click(),
                subMenuProps: {
                    items: this.snippetMenuItems,
                },
            },
            {
                key: 'run',
                text: 'Run',
                ariaLabel: 'Run program (Ctrl+Enter)',
                title: 'Run program (Ctrl+Enter)',
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
                key: 'changelog',
                text: 'What\'s new',
                ariaLabel: 'Changelog',
                disabled: this.props.loading,
                iconProps: {iconName: 'Giftbox'},
                onClick: () => {
                    this.setState({showChangelog: true});
                }
            },
            {
                key: 'format',
                text: 'Format Code',
                ariaLabel: 'Format Code (Ctrl+Shift+F)',
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
            <MessageBar
                className={this.state.showUpdateBanner ? 'app__update app__update--visible' : 'app__update'}
                messageBarType={MessageBarType.warning}
                onDismiss={() => this.setState({showUpdateBanner: false})}
                dismissButtonAriaLabel="Close"
                isMultiline={false}
                actions={
                    <div>
                        <MessageBarButton onClick={() => {
                            this.setState({showUpdateBanner: false});
                            config.forceRefreshPage();
                        }}>Action</MessageBarButton>
                    </div>
                }
            >
                Web application was updated, click <b>Reload</b> to apply changes
            </MessageBar>
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
            <ChangeLogModal onClose={() => this.setState({showChangelog: false})} isOpen={this.state.showChangelog} />
        </header>;
    }
}

