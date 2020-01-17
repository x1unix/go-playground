import React from 'react';
import './Header.css'
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar';
import * as actions from './editor/actions';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

interface HeaderState {
    loading: boolean
}

export class Header extends React.Component<any, HeaderState> {
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

    async onItemSelect() {
        const file = this.fileInput?.files?.item(0);
        if (!file) {
            return;
        }

        try {
            await actions.loadFile(file);
        } catch (err) {
            console.error(err);
        }
    }

    onFileSave() {
        actions.saveEditorContents()
            .catch(err => console.error('failed to save file: %s', err))
    }

    get menuItems(): ICommandBarItemProps[] {
        return [
            {
                key: 'openFile',
                text: 'Open',
                iconProps: {iconName: 'OpenFile'},
                onClick: () => this.fileInput?.click(),
            },
            {
                key: 'share',
                text: 'Share',
                iconProps: {iconName: 'Share'},
            },
            {
                key: 'download',
                text: 'Download',
                iconProps: {iconName: 'Download'},
                onClick: () => {
                    this.onFileSave();
                },
            }
        ];
    }

    get asideItems(): ICommandBarItemProps[] {
        return [
            {
                key: 'run',
                text: 'Run',
                ariaLabel: 'Run',
                iconOnly: true,
                iconProps: {iconName: 'Play'},
                disabled: this.state.loading,
                onClick: () => {
                    this.setState({loading: true});
                    actions.buildAndRun()
                        .finally(() => this.setState({loading: false}));
                }
            },
            {
                key: 'format',
                text: 'Format',
                ariaLabel: 'Format',
                iconOnly: true,
                disabled: this.state.loading,
                iconProps: {iconName: 'Code'},
                onClick: () => {
                    this.setState({loading: true});
                    actions.reformatCode()
                        .finally(() => this.setState({loading: false}));
                }
            }
        ];
    }

    render() {
        return <header className='header'>
            <img
                src='go-logo-blue.svg'
                className='header__logo'
                alt='Golang Logo'
            />
            {this.state.loading ? (
                <Spinner size={SpinnerSize.large} className="header__preloader" />
            ) : (
                <CommandBar
                    className='header__commandBar'
                    items={this.menuItems}
                    farItems={this.asideItems}
                    ariaLabel='CodeEditor menu'
                />
            )}
        </header>;
    }
}

