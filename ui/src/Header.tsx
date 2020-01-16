import React from 'react';
import './Header.css'
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar';
// import { IButtonProps } from 'office-ui-fabric-react/lib/Button';

const menuItems: ICommandBarItemProps[] = [
    {
        key: 'openFile',
        text: 'Open',
        iconProps: {iconName: 'OpenFile'},
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
    }
];

const asideItems: ICommandBarItemProps[] = [
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

export const Header = () => {
    return <header className="header">
        <img
            src="go-logo-blue.svg"
            className="header__logo"
            alt="Golang Logo"
        />
        <CommandBar
            className="header__commandBar"
            items={menuItems}
            farItems={asideItems}
            ariaLabel="CodeEditor menu"
        />
    </header>;
};
