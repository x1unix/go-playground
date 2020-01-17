import React from 'react';
import './Header.css'
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar';
import { loadFile, saveEditorContents } from './editor/actions';

// import { IButtonProps } from 'office-ui-fabric-react/lib/Button';

export class Header extends React.Component {
    private fileInput?: HTMLInputElement;

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
            await loadFile(file);
        } catch (err) {
            console.error(err);
        }
    }

    onFileSave() {
        saveEditorContents().catch(err => console.error('failed to save file: %s', err))
    }

    menuItems: ICommandBarItemProps[] = [
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

    asideItems: ICommandBarItemProps[] = [
        {
            key: 'run',
            text: 'Run',
            ariaLabel: 'Run',
            iconOnly: true,
            iconProps: {iconName: 'Play'},
        },
        {
            key: 'format',
            text: 'Format',
            ariaLabel: 'Format',
            iconOnly: true,
            iconProps: {iconName: 'Code'},
        }
    ];

    render() {
        return <header className='header'>
            <img
                src='go-logo-blue.svg'
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

