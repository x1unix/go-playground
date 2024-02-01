import React from 'react'
import { CommandBar, type ICommandBarItemProps, Stack } from '@fluentui/react'

import type { Snippet } from '~/services/examples'
import apiClient, { type VersionsInfo } from '~/services/api'
import { newAddNotificationAction, NotificationType } from '~/store/notifications'
import { SettingsModal, type SettingsChanges } from '~/components/features/settings/SettingsModal'
import { ThemeableComponent } from '~/components/utils/ThemeableComponent'
import { AboutModal } from '~/components/modals/AboutModal'
import { ExamplesModal } from '~/components/features/examples/ExamplesModal'
import { RunTargetSelector } from '~/components/elements/inputs/RunTargetSelector'
import { SharePopup } from '~/components/utils/SharePopup'

import { dispatchTerminalSettingsChange } from '~/store/terminal'
import {
  dispatchFormatFile,
  dispatchLoadSnippet,
  dispatchLoadSnippetFromSource,
  dispatchShareSnippet,
} from '~/store/workspace/dispatchers'
import {
  Connect,
  type Dispatcher,
  dispatchToggleTheme,
  newMonacoParamsChangeDispatcher,
  newSettingsChangeDispatcher,
  runFileDispatcher,
} from '~/store'

import './Header.css'

/**
 * Unique class name for share button to use as popover target.
 */
const BTN_SHARE_CLASSNAME = 'Header__btn--share'

interface HeaderState {
  showSettings?: boolean
  showAbout?: boolean
  showExamples?: boolean
  loading?: boolean
  showShareMessage?: boolean
  goVersions?: VersionsInfo
}

interface Props {
  darkMode: boolean
  loading: boolean
  running: boolean
  snippetName?: string
  hideThemeToggle?: boolean
  dispatch: (d: Dispatcher) => void
}

// FIXME: rewrite to function component and refactor all that re-render mess.
@Connect(({ settings, status, ui }) => ({
  darkMode: settings.darkMode,
  loading: status?.loading,
  running: status?.running,
  hideThemeToggle: settings.useSystemTheme,
  snippetName: ui?.shareCreated && ui?.snippetId,
}))
export class Header extends ThemeableComponent<any, HeaderState> {
  constructor(props: Props) {
    super(props)
    this.state = {
      showSettings: false,
      showAbout: false,
      loading: false,
      showShareMessage: false,
    }
  }

  componentDidMount(): void {
    apiClient
      .getBackendVersions()
      .then((rsp) => {
        this.setState({
          goVersions: rsp,
        })
      })
      .catch((err) =>
        this.props.dispatch(
          newAddNotificationAction({
            id: 'VERSIONS_FETCH_ERROR',
            type: NotificationType.Error,
            title: 'Failed to fetch Go version info',
            description: err.toString(),
            canDismiss: true,
          }),
        ),
      )
  }

  get isDisabled() {
    return this.props.loading || this.props.running
  }

  get menuItems(): ICommandBarItemProps[] {
    return [
      {
        key: 'run',
        text: 'Run',
        ariaLabel: 'Run program (Ctrl+Enter)',
        title: 'Run program (Ctrl+Enter)',
        iconProps: { iconName: 'Play' },
        disabled: this.isDisabled,
        onClick: () => {
          this.props.dispatch(runFileDispatcher)
        },
      },
      {
        key: 'share',
        text: 'Share',
        className: BTN_SHARE_CLASSNAME,
        iconProps: { iconName: 'Share' },
        disabled: this.isDisabled,
        onClick: () => {
          this.setState({ showShareMessage: true })
          this.props.dispatch(dispatchShareSnippet())
        },
      },
      {
        key: 'explore',
        text: 'Examples',
        iconProps: {
          iconName: 'TestExploreSolid',
        },
        disabled: this.isDisabled,
        onClick: () => {
          this.setState({ showExamples: true })
        },
      },
      {
        key: 'settings',
        text: 'Settings',
        ariaLabel: 'Settings',
        iconProps: { iconName: 'Settings' },
        disabled: this.isDisabled,
        onClick: () => {
          this.setState({ showSettings: true })
        },
      },
      {
        key: 'about',
        text: 'About',
        ariaLabel: 'About',
        iconProps: { iconName: 'Info' },
        onClick: () => {
          this.setState({ showAbout: true })
        },
      },
    ]
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
                marginRight: '.5rem',
              }}
            >
              <RunTargetSelector responsive disabled={this.isDisabled} goVersions={this.state.goVersions} />
            </Stack>
          )
        },
      },
      {
        key: 'format',
        text: 'Format Code',
        ariaLabel: 'Format Code (Ctrl+Shift+F)',
        iconOnly: true,
        disabled: this.isDisabled,
        iconProps: { iconName: 'Code' },
        onClick: () => {
          this.props.dispatch(dispatchFormatFile())
        },
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
      },
    ]
  }

  private onSettingsClose(changes: SettingsChanges) {
    if (changes.monaco) {
      // Update monaco state if some of its settings were changed
      this.props.dispatch(newMonacoParamsChangeDispatcher(changes.monaco))
    }

    if (changes.settings) {
      this.props.dispatch(newSettingsChangeDispatcher(changes.settings))
    }

    if (changes.terminal) {
      this.props.dispatch(dispatchTerminalSettingsChange(changes.terminal))
    }

    this.setState({ showSettings: false })
  }

  private onSnippetSelected(snippet: Snippet) {
    this.setState({ showExamples: false })
    if (snippet.source) {
      this.props.dispatch(dispatchLoadSnippetFromSource(snippet.source))
      return
    }

    this.props.dispatch(dispatchLoadSnippet(snippet.id))
  }

  render() {
    const { showShareMessage, showAbout, showSettings, showExamples } = this.state
    const { snippetName } = this.props
    return (
      <header className="header" style={{ backgroundColor: this.theme.palette.white }}>
        <img src="/go-logo-blue.svg" className="header__logo" alt="Golang Logo" />
        <CommandBar
          className="header__commandBar"
          items={this.menuItems}
          farItems={this.asideItems.filter(({ hidden }) => !hidden)}
          ariaLabel="CodeEditor menu"
        />
        <SharePopup
          visible={!!(showShareMessage && snippetName)}
          target={`.${BTN_SHARE_CLASSNAME}`}
          snippetId={snippetName}
          onDismiss={() => {
            this.setState({ showShareMessage: false })
          }}
        />
        <SettingsModal
          onClose={(args) => {
            this.onSettingsClose(args)
          }}
          isOpen={showSettings}
        />
        <AboutModal
          onClose={() => {
            this.setState({ showAbout: false })
          }}
          isOpen={showAbout}
        />
        <ExamplesModal
          isOpen={showExamples}
          onDismiss={() => this.setState({ showExamples: false })}
          onSelect={(s) => this.onSnippetSelected(s)}
        />
      </header>
    )
  }
}
