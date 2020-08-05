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
                <span id={TITLE_ID}>Changelog</span>
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
                        <li>Added list of snippets with <u>templates and tutorials</u> near <b>Open</b> menu item</li>
                        <li>Moved <b>Settings</b> menu button from drop-down to main section</li>
                    </ul>
                </p>
                <p>
                    <b>Interface - Settings</b>
                    <ul>
                        <li>Added editor fonts selector</li>
                        <li>Added support of font code ligatures</li>
                        <li>Fixed fallback font issue that might cause issues on Linux</li>
                    </ul>
                </p>
                <p>
                    And more!
                </p>
                <p>
                    Full release notes for {config.appVersion} are available <Link href={`${config.githubUrl}/releases/latest`} target='_blank'>here</Link>
                </p>
            </div>
        </Modal>
    )
}

ChangeLogModal.defaultProps = {isOpen: false};