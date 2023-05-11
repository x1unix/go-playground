import React from 'react';
import {
  CommandBar,
  ICommandBarItemProps, Stack,
} from '@fluentui/react';

import environment from "~/environment";
import apiClient, {VersionsInfo} from "~/services/api";
import {newAddNotificationAction, NotificationType} from "~/store/notifications";
import SettingsModal, { SettingsChanges } from '~/components/settings/SettingsModal';
import ThemeableComponent from '~/components/utils/ThemeableComponent';
import AboutModal from '~/components/modals/AboutModal';
import ChangeLogModal from '~/components/modals/ChangeLogModal';
import RunTargetSelector from '~/components/inputs/RunTargetSelector';
import SharePopup from '~/components/utils/SharePopup';
import {
  Connect,
  Dispatcher,
  dispatchToggleTheme,
  formatFileDispatcher,
  newCodeImportDispatcher,
  newImportFileDispatcher,
  newMonacoParamsChangeDispatcher,
  newSnippetLoadDispatcher,
  newSettingsChangeDispatcher,
  runFileDispatcher,
  saveFileDispatcher,
  shareSnippetDispatcher
} from '~/store';
import { getSnippetsMenuItems, SnippetMenuItem } from './utils';

import './Header.css';

/**
 * Uniquie class name for share button to use as popover target.
 */
const BTN_SHARE_CLASSNAME = 'Header__btn--share';

interface HeaderState {
  showSettings?: boolean
  showAbout?: boolean
  showChangelog?: boolean
  loading?: boolean
  showShareMessage?: boolean
  goVersions?: VersionsInfo
}

interface Props {
  darkMode: boolean
  loading: boolean
  running: boolean
  snippetName?: string
  hideThemeToggle?: boolean,
  dispatch: (d: Dispatcher) => void
}

// FIXME: rewrite to function component and refactor all that re-render mess.
@Connect((
  {
    settings, status, ui
  }
) => ({
  darkMode: settings.darkMode,
  loading: status?.loading,
  running: status?.running,
  hideThemeToggle: settings.useSystemTheme,
  snippetName: ui?.shareCreated && ui?.snippetId
}))
export class Header extends ThemeableComponent<any, HeaderState> {
  private fileInput?: HTMLInputElement;
  private snippetMenuItems = getSnippetsMenuItems(i => this.onSnippetMenuItemClick(i));

  constructor(props: Props) {
    super(props);
    this.state = {
      showSettings: false,
      showAbout: false,
      showChangelog: false,
      loading: false,
      showShareMessage: false
    };
  }

  componentDidMount(): void {
    const fileElement = document.createElement('input') as HTMLInputElement;
    fileElement.type = 'file';
    fileElement.accept = '.go';
    fileElement.addEventListener('change', () => this.onItemSelect(), false);
    this.fileInput = fileElement;

    apiClient.getBackendVersions().then(rsp => {
      this.setState({
        goVersions: rsp
      });
    }).catch(err => this.props.dispatch(
      newAddNotificationAction({
        id: 'VERSIONS_FETCH_ERROR',
        type: NotificationType.Error,
        title: 'Failed to fetch Go version info',
        description: err.toString(),
        canDismiss: true,
      })
    ));
  }

  onItemSelect() {
    const file = this.fileInput?.files?.item(0);
    if (!file) {
      return;
    }

    this.props.dispatch(newImportFileDispatcher(file));
  }

  onSnippetMenuItemClick(item: SnippetMenuItem) {
    const dispatcher = item.snippet ?
      newSnippetLoadDispatcher(item.snippet) :
      newCodeImportDispatcher(item.label, item.text as string);
    this.props.dispatch(dispatcher);
  }

  get isDisabled() {
    return this.props.loading || this.props.running;
  }

  get menuItems(): ICommandBarItemProps[] {
    return [
      {
        key: 'openFile',
        text: 'Open',
        split: true,
        iconProps: { iconName: 'OpenFile' },
        disabled: this.isDisabled,
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
        iconProps: { iconName: 'Play' },
        disabled: this.isDisabled,
        onClick: () => {
          this.props.dispatch(runFileDispatcher);
        }
      },
      {
        key: 'share',
        text: 'Share',
        className: BTN_SHARE_CLASSNAME,
        iconProps: { iconName: 'Share' },
        disabled: this.isDisabled,
        onClick: () => {
          this.setState({ showShareMessage: true });
          this.props.dispatch(shareSnippetDispatcher);
        }
      },
      {
        key: 'download',
        text: 'Download',
        iconProps: { iconName: 'Download' },
        disabled: this.isDisabled,
        onClick: () => {
          this.props.dispatch(saveFileDispatcher);
        },
      },
      {
        key: 'settings',
        text: 'Settings',
        ariaLabel: 'Settings',
        iconProps: { iconName: 'Settings' },
        disabled: this.isDisabled,
        onClick: () => {
          this.setState({ showSettings: true });
        }
      }
    ];
  }

  get asideItems(): ICommandBarItemProps[] {
    return [
      {
        key: 'selectEnvironment',
        commandBarButtonAs: (_) => {
          return (
            <Stack
              horizontal
              verticalAlign="center"
              style={{
                marginRight: ".5rem"
              }}
            >
              <RunTargetSelector
                responsive
                disabled={this.isDisabled}
                goVersions={this.state.goVersions}
              />
            </Stack>
          )
        }
      },
      {
        key: 'format',
        text: 'Format Code',
        ariaLabel: 'Format Code (Ctrl+Shift+F)',
        iconOnly: true,
        disabled: this.isDisabled,
        iconProps: { iconName: 'Code' },
        onClick: () => {
          this.props.dispatch(formatFileDispatcher);
        }
      },
      {
        key: 'toggleTheme',
        text: 'Toggle Dark Mode',
        ariaLabel: 'Toggle Dark Mode',
        iconOnly: true,
        hidden: this.props.hideThemeToggle,
        iconProps: { iconName: this.props.darkMode ? 'Brightness' : 'ClearNight' },
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
        iconProps: { iconName: 'Bug' },
        onClick: () => window.open(environment.urls.issue, '_blank')
      },
      {
        key: 'donate',
        text: 'Donate',
        ariaLabel: 'Donate',
        iconProps: { iconName: 'Heart' },
        onClick: () => window.open(environment.urls.donate, '_blank')
      },
      {
        key: 'changelog',
        text: 'What\'s new',
        ariaLabel: 'Changelog',
        iconOnly: true,
        disabled: this.isDisabled,
        iconProps: { iconName: 'Giftbox' },
        onClick: () => {
          this.setState({ showChangelog: true });
        }
      },
      {
        key: 'about',
        text: 'About',
        ariaLabel: 'About',
        iconProps: { iconName: 'Info' },
        onClick: () => {
          this.setState({ showAbout: true });
        }
      }
    ]
  }

  private onSettingsClose(changes: SettingsChanges) {
    if (changes.monaco) {
      // Update monaco state if some of its settings were changed
      this.props.dispatch(newMonacoParamsChangeDispatcher(changes.monaco));
    }

    if (changes.settings) {
      this.props.dispatch(newSettingsChangeDispatcher(changes.settings));
    }

    this.setState({ showSettings: false });
  }

  render() {
    const { showShareMessage } = this.state;
    const { snippetName } = this.props;
    return (
      <header
        className='header'
        style={{backgroundColor: this.theme.palette.white}}
      >
        <img
          src='/go-logo-blue.svg'
          className='header__logo'
          alt='Golang Logo'
        />
        <CommandBar
          className='header__commandBar'
          items={this.menuItems}
          farItems={this.asideItems.filter(({hidden}) => !hidden)}
          overflowItems={this.overflowItems}
          ariaLabel='CodeEditor menu'
        />
        <SharePopup
          visible={!!(showShareMessage && snippetName)}
          target={`.${BTN_SHARE_CLASSNAME}`}
          snippetId={snippetName}
          onDismiss={() => this.setState({ showShareMessage: false })}
        />
        <SettingsModal
          onClose={(args) => this.onSettingsClose(args)}
          isOpen={this.state.showSettings}
        />
        <AboutModal
          onClose={() => this.setState({ showAbout: false })}
          isOpen={this.state.showAbout}
        />
        <ChangeLogModal
          onClose={() => this.setState({ showChangelog: false })}
          isOpen={this.state.showChangelog}
        />
      </header>
    );
  }
}
