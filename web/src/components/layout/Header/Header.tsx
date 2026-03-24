import React, { useCallback, useEffect, useState } from 'react'
import { addDays } from 'date-fns'
import { CommandBar, type ICommandBarItemProps, Stack, useTheme } from '@fluentui/react'
import { useDispatch, useSelector } from 'react-redux'

import type { Snippet } from '~/services/examples'
import apiClient, { type VersionsInfo } from '~/services/api'
import { newAddNotificationAction, NotificationType } from '~/store/notifications'
import { ConnectedSettingsModal, type SettingsChanges } from '~/components/features/settings/SettingsModal'
import { AboutModal } from '~/components/modals/AboutModal'
import { ExamplesModal } from '~/components/features/examples/ExamplesModal'
import { RunTargetSelector } from '~/components/elements/inputs/RunTargetSelector'
import { SharePopup } from '~/components/utils/SharePopup'

import { keyValue } from '~/services/storage'
import { dispatchTerminalSettingsChange } from '~/store/terminal'
import {
  dispatchFormatFile,
  dispatchLoadSnippet,
  dispatchLoadSnippetFromSource,
  dispatchShareSnippet,
} from '~/store/workspace/dispatchers'
import {
  dispatchToggleTheme,
  newMonacoParamsChangeDispatcher,
  newSettingsChangeDispatcher,
  newUIStateChangeAction,
  runFileDispatcher,
  type State,
} from '~/store'

import './Header.css'

/**
 * Unique class name for share button to use as popover target.
 */
const BTN_SHARE_CLASSNAME = 'Header__btn--share'

const goVersionsCacheEntry = {
  key: 'api.go.versions',
  ttl: () => addDays(new Date(), 7),
  getInitialValue: async () => await apiClient.getBackendVersions(),
}

export const Header: React.FC = () => {
  const dispatch = useDispatch()
  const theme = useTheme()
  const [showSettings, setShowSettings] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showExamples, setShowExamples] = useState(false)
  const [goVersions, setGoVersions] = useState<VersionsInfo>()

  const darkMode = useSelector(({ settings }: State) => settings.darkMode)
  const isDisabled = useSelector(({ status }: State) => Boolean(status?.loading || status?.running))
  const hideThemeToggle = useSelector(({ settings }: State) => settings.useSystemTheme)
  const sharedSnippetName = useSelector(({ ui }: State) => (ui?.shareCreated ? ui?.snippetId : undefined))

  useEffect(() => {
    let isMounted = true

    keyValue
      .getOrInsert(goVersionsCacheEntry)
      .then((rsp) => {
        if (!isMounted) {
          return
        }

        setGoVersions(rsp)
      })
      .catch((err) =>
        dispatch(
          newAddNotificationAction({
            id: 'VERSIONS_FETCH_ERROR',
            type: NotificationType.Error,
            title: 'Failed to fetch Go version info',
            description: err.toString(),
            canDismiss: true,
          }),
        ),
      )

    return () => {
      isMounted = false
    }
  }, [dispatch])

  const onSettingsClose = useCallback(
    (changes: SettingsChanges) => {
      if (changes.monaco) {
        dispatch(newMonacoParamsChangeDispatcher(changes.monaco))
      }

      if (changes.settings) {
        dispatch(newSettingsChangeDispatcher(changes.settings))
      }

      if (changes.terminal) {
        dispatch(dispatchTerminalSettingsChange(changes.terminal))
      }

      setShowSettings(false)
    },
    [dispatch],
  )

  const onSnippetSelected = useCallback(
    (snippet: Snippet) => {
      setShowExamples(false)
      if (snippet.source) {
        dispatch(dispatchLoadSnippetFromSource(snippet.source))
        return
      }

      dispatch(dispatchLoadSnippet(snippet.id))
    },
    [dispatch],
  )

  const menuItems: ICommandBarItemProps[] = [
    {
      key: 'run',
      text: 'Run',
      ariaLabel: 'Run program (Ctrl+Enter)',
      title: 'Run program (Ctrl+Enter)',
      iconProps: { iconName: 'IoMdPlay' },
      disabled: isDisabled,
      buttonStyles: {
        icon: {
          color: theme.palette.green,
        },
      },
      onClick: () => {
        dispatch(runFileDispatcher)
      },
    },
    {
      key: 'share',
      text: 'Share',
      className: BTN_SHARE_CLASSNAME,
      iconProps: { iconName: 'Share' },
      disabled: isDisabled,
      onClick: () => {
        dispatch(dispatchShareSnippet())
      },
    },
    {
      key: 'format',
      text: 'Format',
      ariaLabel: 'Format Code (Alt+F)',
      disabled: isDisabled,
      iconProps: { iconName: 'code' },
      onClick: () => {
        dispatch(dispatchFormatFile())
      },
    },
    {
      key: 'explore',
      text: 'Examples',
      iconProps: {
        iconName: 'TestExploreSolid',
      },
      disabled: isDisabled,
      onClick: () => {
        setShowExamples(true)
      },
    },
    {
      key: 'settings',
      text: 'Settings',
      ariaLabel: 'Settings',
      iconProps: { iconName: 'Settings' },
      disabled: isDisabled,
      onClick: () => {
        setShowSettings(true)
      },
    },
    {
      key: 'about',
      text: 'About',
      ariaLabel: 'About',
      iconProps: { iconName: 'Info' },
      onClick: () => {
        setShowAbout(true)
      },
    },
  ]

  const asideItems: ICommandBarItemProps[] = [
    {
      key: 'selectEnvironment',
      commandBarButtonAs: () => {
        return (
          <Stack horizontal verticalAlign="center">
            <RunTargetSelector responsive disabled={isDisabled} goVersions={goVersions} />
          </Stack>
        )
      },
    },
    {
      key: 'toggleTheme',
      text: 'Toggle Dark Mode',
      ariaLabel: 'Toggle Dark Mode',
      iconOnly: true,
      hidden: hideThemeToggle,
      iconProps: { iconName: darkMode ? 'Brightness' : 'ClearNight' },
      onClick: () => {
        dispatch(dispatchToggleTheme)
      },
    },
  ]

  return (
    <header className="header" style={{ backgroundColor: theme.palette.white }}>
      <img src="/go-logo-blue.svg" className="header__logo" alt="Golang Logo" />
      <CommandBar
        key={isDisabled ? 'header-commandbar-disabled' : 'header-commandbar-enabled'}
        className="header__commandBar"
        items={menuItems}
        farItems={asideItems.filter(({ hidden }) => !hidden)}
        ariaLabel="CodeEditor menu"
      />
      <SharePopup
        visible={!!sharedSnippetName?.length}
        target={`.${BTN_SHARE_CLASSNAME}`}
        snippetId={sharedSnippetName}
        onDismiss={() => {
          dispatch(newUIStateChangeAction({ shareCreated: false }))
        }}
      />
      <ConnectedSettingsModal onClose={onSettingsClose} isOpen={showSettings} />
      <AboutModal
        isOpen={showAbout}
        onClose={() => {
          setShowAbout(false)
        }}
        onTitleClick={() => {
          setShowAbout(false)
          onSnippetSelected({
            label: 'bad-apple',
            source: {
              basePath: 'testdata',
              files: ['bad-apple.go'],
            },
          })
        }}
      />
      <ExamplesModal
        isOpen={showExamples}
        onDismiss={() => setShowExamples(false)}
        onSelect={(s) => onSnippetSelected(s)}
      />
    </header>
  )
}
