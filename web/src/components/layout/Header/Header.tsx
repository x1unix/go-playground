import React, { useEffect, useMemo, useState, useRef } from 'react'
import { clsx } from 'clsx'
import { addDays } from 'date-fns'
import { useDispatch, useSelector } from 'react-redux'
import { IContextualMenuItem, type IContextualMenuProps, useTheme } from '@fluentui/react'
import { TooltipHost, ITooltipHostStyles } from '@fluentui/react/lib/Tooltip'
import { CommandBarButton, IconButton } from '@fluentui/react/lib/Button'
import { useId } from '@fluentui/react-hooks'

import { SharePopup } from '~/components/utils/SharePopup'
import { RunTargetSelector } from '~/components/elements/inputs/RunTargetSelector'
import { newAddNotificationAction, NotificationType } from '~/store/notifications'
import { keyValue } from '~/services/storage'
import apiClient, { type VersionsInfo } from '~/services/api'

import classes from './Header.module.css'

interface ToggleThemeButtonProps {
  hidden?: boolean
  isDark: boolean
}

const tooltipStyles: Partial<ITooltipHostStyles> = {
  root: { display: 'inline-block', height: '100%', marginLeft: 'var(--header-padding-x)' },
}
const ToggleThemeButton = ({ hidden, isDark }: ToggleThemeButtonProps) => {
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
      />
    </TooltipHost>
  )
}

const HeaderSeparator = () => <div className={classes['Header--separator']} aria-hidden />

// Class to map share popup to a button.
// Used instead of `useRef` as CommandBarButton's "ref" is deprecated, but no viable alternative is provided.
const BTN_SHARE_CLASS = 'Header--btn__share'

const goVersionsCacheEntry = {
  key: 'api.go.versions',
  ttl: () => addDays(new Date(), 7),
  getInitialValue: async () => await apiClient.getBackendVersions(),
}

export const Header = () => {
  const dispatch = useDispatch()
  const theme = useTheme()
  const [goVersions, setGoVersions] = useState<VersionsInfo>()

  const cssVars: Record<string, string> = useMemo(
    () => ({
      '--header-bg': theme.semanticColors.bodyBackground,
      '--header-fg': theme.semanticColors.bodyText,
      '--header-separator-bg': theme.semanticColors.disabledBorder,
    }),
    [theme],
  )

  // Note: move aside items into dropdown at max-width 740px
  const isDisabled = false
  const darkMode = false
  const isThemeToggleHidden = false
  const isDropdownVisible = false
  const sharedSnippetName = ''

  const asideMenuItemProps: IContextualMenuProps = useMemo(() => {
    let items: IContextualMenuItem[] = [
      {
        key: 'toggle-theme',
        text: 'Toggle Theme',
        iconProps: { iconName: 'ClearNight' },

        // Extra props to hide toggle when system color scheme is preferred or dropdown menu is hidden on large screens.
        showOnlyInDropdown: true,
        hidden: isThemeToggleHidden,
      },
      {
        key: 'settings',
        text: 'Settings',
        iconProps: { iconName: 'Settings' },
        disabled: isDisabled,
      },
      {
        key: 'about',
        text: 'About',
        iconProps: { iconName: 'Info' },
      },
    ]

    return {
      items: items.filter((e) => ('hidden' in e ? !e.hidden : true)),
    }
  }, [isDisabled, isThemeToggleHidden])

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

  return (
    <header className={classes.Header} style={cssVars}>
      <div className={classes['Header--left']}>
        <img src="/go-logo-blue.svg" className={classes['Header--logo']} alt="Golang Logo" />
        <CommandBarButton
          className={classes['Header--btn']}
          iconProps={{ iconName: 'IoMdPlay' }}
          styles={{
            icon: {
              color: theme.palette.green,
            },
          }}
          text="Run"
        />
        <HeaderSeparator />
        <CommandBarButton
          className={clsx(classes['Header--btn'], BTN_SHARE_CLASS)}
          iconProps={{ iconName: 'Share' }}
          text="Share"
        />
        <CommandBarButton className={classes['Header--btn']} iconProps={{ iconName: 'Code' }} text="Format" />
        <CommandBarButton
          className={classes['Header--btn']}
          iconProps={{ iconName: 'TestExploreSolid' }}
          text="Examples"
        />
        <HeaderSeparator />
        {isDropdownVisible ? (
          <IconButton
            key="dropdown"
            iconProps={{ iconName: 'More' }}
            menuProps={asideMenuItemProps}
            styles={{ menuIcon: { display: 'none' } }}
          />
        ) : (
          asideMenuItemProps.items
            .filter((e) => !('showOnlyInDropdown' in e))
            .map(({ key, iconProps, text, disabled }) => (
              <CommandBarButton
                key={key}
                className={classes['Header--btn']}
                iconProps={iconProps}
                text={text}
                disabled={disabled}
              />
            ))
        )}
      </div>
      <div className={classes['Header--right']}>
        <RunTargetSelector responsive disabled={isDisabled} goVersions={goVersions} />
        <ToggleThemeButton isDark={darkMode} hidden={isThemeToggleHidden || isDropdownVisible} />
      </div>
      <SharePopup
        visible={!!sharedSnippetName?.length}
        target={`.${BTN_SHARE_CLASS}`}
        snippetId={sharedSnippetName}
        onDismiss={() => {
          // dispatch(newUIStateChangeAction({ shareCreated: false }))
        }}
      />
    </header>
  )
}
