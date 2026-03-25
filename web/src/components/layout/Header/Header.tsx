import React, { useEffect, useMemo, useState, useCallback } from 'react'
import { clsx } from 'clsx'
import { addDays } from 'date-fns'
import { useDispatch, useSelector } from 'react-redux'
import { IContextualMenuItem, useTheme } from '@fluentui/react'
import { TooltipHost, type ITooltipHostStyles } from '@fluentui/react/lib/Tooltip'
import { CommandBarButton, type IButtonProps, IconButton } from '@fluentui/react/lib/Button'
import { useId } from '@fluentui/react-hooks'

import { SharePopup } from '~/components/utils/SharePopup'
import { RunTargetSelector } from '~/components/elements/inputs/RunTargetSelector'
import { ConnectedSettingsModal, type SettingsChanges } from '~/components/features/settings/SettingsModal'
import { AboutModal } from '~/components/modals/AboutModal'
import { ExamplesModal } from '~/components/features/examples/ExamplesModal'
import { newAddNotificationAction, NotificationType } from '~/store/notifications'
import type { Snippet } from '~/services/examples'
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

import apiClient, { type VersionsInfo } from '~/services/api'

import classes from './Header.module.css'

enum MenuActionType {
  ShowSettings,
  ShowAbout,
  ToggleTheme,
}

interface ToggleThemeButtonProps {
  hidden?: boolean
  isDark: boolean
  onClick?: () => void
}

const tooltipStyles: Partial<ITooltipHostStyles> = {
  root: { display: 'inline-block', height: '100%', marginLeft: 'var(--header-padding-x)' },
}
const ToggleThemeButton = ({ hidden, isDark, onClick }: ToggleThemeButtonProps) => {
  const tooltipId = useId('tooltip')
  if (hidden) {
    return null
  }

  return (
    <TooltipHost id={tooltipId} content="Toggle Dark Mode" styles={tooltipStyles}>
      <IconButton
        className={classes['Header--btn']}
        iconProps={{ iconName: isDark ? 'Brightness' : 'ClearNight' }}
        aria-label="Toggle Dark Mode"
        onClick={onClick}
        data={MenuActionType.ToggleTheme}
      />
    </TooltipHost>
  )
}

const HeaderSeparator = () => <div className={classes['Header--separator']} aria-hidden />

// Class to map share popup to a button.
// Used instead of `useRef` as CommandBarButton's "ref" is deprecated, but no viable alternative is provided.
const BTN_SHARE_CLASS = 'Header--btn__share'

// Breakpoint in pixels to hide aside menu items into a dropdown.
const COMPACT_MENU_BREAKPOINT_PX = 745

const goVersionsCacheEntry = {
  key: 'api.go.versions',
  ttl: () => addDays(new Date(), 7),
  getInitialValue: async () => await apiClient.getBackendVersions(),
}

interface ModalStates {
  showSettings?: boolean
  showAbout?: boolean
  showExamples?: boolean
}

export const Header = () => {
  const dispatch = useDispatch()
  const theme = useTheme()

  // Fetch available Go versions
  const [goVersions, setGoVersions] = useState<VersionsInfo>()
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

  const cssVars: Record<string, string> = useMemo(
    () => ({
      '--header-bg': theme.semanticColors.bodyBackground,
      '--header-fg': theme.semanticColors.bodyText,
      '--header-separator-bg': theme.semanticColors.disabledBorder,
    }),
    [theme],
  )

  // Window width listener to hide aside items into a dropdown.
  const [isCompact, setIsCompact] = useState(window.innerWidth < COMPACT_MENU_BREAKPOINT_PX)
  useEffect(() => {
    let raf = 0
    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        setIsCompact(window.innerWidth < COMPACT_MENU_BREAKPOINT_PX)
      })
    }

    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [setIsCompact])

  const [modalStates, setModalStates] = useState<ModalStates>({})

  const isDisabled = useSelector(({ status }: State) => Boolean(status?.loading || status?.running))
  const darkMode = useSelector(({ settings }: State) => settings.darkMode)
  const isThemeToggleHidden = useSelector(({ settings }: State) => settings.useSystemTheme)
  const sharedSnippetName = useSelector(({ ui }: State) => (ui?.shareCreated ? ui?.snippetId : undefined))

  const asideMenuItems: IContextualMenuItem[] = useMemo(() => {
    let items: IContextualMenuItem[] = [
      {
        key: 'toggle-theme',
        text: 'Toggle Theme',
        iconProps: { iconName: 'ClearNight' },
        data: MenuActionType.ToggleTheme,

        // Extra props to hide toggle when system color scheme is preferred or dropdown menu is hidden on large screens.
        showOnlyInDropdown: true,
        hidden: isThemeToggleHidden,
      },
      {
        key: 'settings',
        text: 'Settings',
        iconProps: { iconName: 'Settings' },
        disabled: isDisabled,
        data: MenuActionType.ShowSettings,
      },
      {
        key: 'about',
        text: 'About',
        iconProps: { iconName: 'Info' },
        data: MenuActionType.ShowAbout,
      },
    ]

    return items.filter((e) => ('hidden' in e ? !e.hidden : true))
  }, [isDisabled, isThemeToggleHidden])

  const onMenuItemClick = (cmd: MenuActionType) => {
    switch (cmd) {
      case MenuActionType.ToggleTheme: {
        dispatch(dispatchToggleTheme)
        return
      }
      case MenuActionType.ShowSettings: {
        setModalStates({ showSettings: true })
        return
      }
      case MenuActionType.ShowAbout: {
        setModalStates({ showAbout: true })
        return
      }
    }
  }

  // Modal handlers
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

      setModalStates({ showSettings: false })
    },
    [dispatch],
  )

  const onSnippetSelected = useCallback(
    (snippet: Snippet) => {
      setModalStates({ showExamples: false })
      if (snippet.source) {
        dispatch(dispatchLoadSnippetFromSource(snippet.source))
        return
      }

      dispatch(dispatchLoadSnippet(snippet.id))
    },
    [dispatch],
  )

  return (
    <>
      <header className={classes.Header} style={cssVars}>
        <div className={classes['Header--left']}>
          <img src="/go-logo-blue.svg" className={classes['Header--logo']} alt="Golang Logo" />
          <CommandBarButton
            text="Run"
            disabled={isDisabled}
            className={classes['Header--btn']}
            iconProps={{ iconName: 'IoMdPlay' }}
            styles={{
              icon: {
                color: theme.palette.green,
              },
            }}
            onClick={() => {
              dispatch(runFileDispatcher)
            }}
          />
          <HeaderSeparator />
          <CommandBarButton
            text="Share"
            disabled={isDisabled}
            className={clsx(classes['Header--btn'], BTN_SHARE_CLASS)}
            iconProps={{ iconName: 'Share' }}
            onClick={() => {
              dispatch(dispatchShareSnippet())
            }}
          />
          <CommandBarButton
            text="Format"
            className={classes['Header--btn']}
            iconProps={{ iconName: 'Code' }}
            disabled={isDisabled}
            onClick={() => {
              dispatch(dispatchFormatFile())
            }}
          />
          <CommandBarButton
            text="Examples"
            disabled={isDisabled}
            className={classes['Header--btn']}
            iconProps={{ iconName: 'TestExploreSolid' }}
            onClick={() => {
              setModalStates({ showExamples: true })
            }}
          />
          <HeaderSeparator />
          {isCompact ? (
            <IconButton
              key="dropdown"
              iconProps={{ iconName: 'More' }}
              styles={{ menuIcon: { display: 'none' }, icon: { color: theme.semanticColors.infoIcon } }}
              menuProps={{
                items: asideMenuItems,
                onItemClick: (_, item) => {
                  if (item) {
                    onMenuItemClick(item.data as MenuActionType)
                  }
                },
              }}
            />
          ) : (
            asideMenuItems
              .filter((e) => !('showOnlyInDropdown' in e))
              .map(({ key, iconProps, text, disabled, data }) => (
                <CommandBarButton
                  key={key}
                  className={classes['Header--btn']}
                  iconProps={iconProps}
                  text={text}
                  disabled={disabled}
                  data={data}
                  onClick={() => onMenuItemClick(data as MenuActionType)}
                />
              ))
          )}
        </div>
        <div className={classes['Header--right']}>
          <RunTargetSelector responsive disabled={isDisabled} goVersions={goVersions} />
          <ToggleThemeButton
            isDark={darkMode}
            hidden={isThemeToggleHidden || isCompact}
            onClick={() => dispatch(dispatchToggleTheme)}
          />
        </div>
      </header>

      <SharePopup
        visible={!!sharedSnippetName?.length}
        target={`.${BTN_SHARE_CLASS}`}
        snippetId={sharedSnippetName}
        onDismiss={() => {
          dispatch(newUIStateChangeAction({ shareCreated: false }))
        }}
      />

      <ConnectedSettingsModal onClose={onSettingsClose} isOpen={!!modalStates?.showSettings} />
      <AboutModal
        isOpen={!!modalStates?.showAbout}
        onClose={() => {
          setModalStates({ showAbout: false })
        }}
        onTitleClick={() => {
          setModalStates({ showAbout: false })
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
        isOpen={!!modalStates?.showExamples}
        onDismiss={() => setModalStates({ showExamples: false })}
        onSelect={(s) => onSnippetSelected(s)}
      />
    </>
  )
}
