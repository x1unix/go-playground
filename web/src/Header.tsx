import React from 'react';
import './Header.css'
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar';
import { getTheme } from '@uifabric/styling';
import {
    Connect,
    newImportFileDispatcher,
    formatFileDispatcher,
    runFileDispatcher,
    saveFileDispatcher,
    dispatchToggleTheme, shareSnippetDispatcher
} from './store';

@Connect(s => ({darkMode: s.settings.darkMode, loading: s.status?.loading}))
export class Header extends React.Component<any> {
    private fileInput?: HTMLInputElement;

    constructor(props) {
        super(props);
        this.state = {
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

    get styles() {
        // Apply the same colors as rest of Fabric components
        const theme = getTheme();
        return {
            backgroundColor: theme.palette.white
        }
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
                ariaLabel='CodeEditor menu'
            />
        </header>;
    }
}

