import React from 'react';
import { Modal } from 'office-ui-fabric-react/lib/Modal';
import { Link } from 'office-ui-fabric-react/lib/Link';
import {getTheme, IconButton } from 'office-ui-fabric-react';
import {getContentStyles, getIconButtonStyles} from './styles/modal';
import config from './services/config';

const TITLE_ID = 'ChangeLogTitle';
const SUB_TITLE_ID = 'ChangeLogSubtitle';

interface ChangeLogModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function ChangeLogModal(props: ChangeLogModalProps) {
    const theme = getTheme();
    const contentStyles = getContentStyles(theme);
    const iconButtonStyles = getIconButtonStyles(theme);

    return (
        <Modal
            titleAriaId={TITLE_ID}
            subtitleAriaId={SUB_TITLE_ID}
            isOpen={props.isOpen}
            onDismiss={props.onClose}
            containerClassName={contentStyles.container}
        >
            <div className={contentStyles.header}>
                <span id={TITLE_ID}>Changelog for {config.appVersion}</span>
                <IconButton
                    iconProps={{ iconName: 'Cancel' }}
                    styles={iconButtonStyles}
                    ariaLabel='Close popup modal'
                    onClick={props.onClose as any}
                />
            </div>
            <div id={SUB_TITLE_ID}  className={contentStyles.body}>
                <p>
                    <b>Interface - Global</b>
                    <ul>
                        <li>Add <kbd>F5</kbd> hotkey for <b>Run</b> action</li>
                    </ul>
                </p>
                <p>
                    <b>Interface - Editor</b>
                    <ul>
                        <li>Suggest function arguments completion</li>
                        <li>Fix snippets suggestion issue</li>
                    </ul>
                </p>
                <p>
                    And more!
                </p>
                <p>
                    Full release notes for are available <Link href={`${config.githubUrl}/releases/latest`} target='_blank'>here</Link>
                </p>
            </div>
        </Modal>
    )
}

ChangeLogModal.defaultProps = {isOpen: false};