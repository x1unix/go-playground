import React, { useMemo } from 'react'
import { clsx } from 'clsx'
import { type editor, MarkerSeverity } from 'monaco-editor'
import { VscDebugAlt } from 'react-icons/vsc'
import { useSelector } from 'react-redux'
import environment from '~/environment'
import type { State } from '~/store'

import { EllipsisText } from '~/components/utils/EllipsisText'
import { StatusBarItem, StatusBarItemCounter } from '~/components/layout/StatusBar/StatusBarItem'
import { VimStatusBarItem } from '~/plugins/vim/VimStatusBarItem'

import styles from './StatusBar.module.css'

interface StateProps {
  loading?: boolean
  running?: boolean
  lastError?: string | null
  markers?: Record<string, editor.IMarkerData[] | null>
}

const countMarkers = (markers?: StateProps['markers']) => {
  if (!markers) {
    return {
      errors: 0,
      warnings: 0,
    }
  }

  return Object.values(markers)
    .filter((v) => v?.length)
    .map(getMarkerCounters)
    .reduce(
      (acc, { errors, warnings }) => ({
        errors: acc.errors + errors,
        warnings: acc.warnings + warnings,
      }),
      { errors: 0, warnings: 0 },
    )
}

const getMarkerCounters = (markers?: editor.IMarkerData[] | null) => {
  let errors = 0
  let warnings = 0
  if (!markers?.length) {
    return { errors, warnings }
  }

  for (const marker of markers) {
    switch (marker.severity) {
      case MarkerSeverity.Warning:
        warnings++
        break
      case MarkerSeverity.Error:
        errors++
        break
      default:
        break
    }
  }

  return { errors, warnings }
}

const getStatusItem = ({ loading, running, lastError }: StateProps) => {
  if (loading) {
    return (
      <StatusBarItem icon="Build">
        <EllipsisText>Loading</EllipsisText>
      </StatusBarItem>
    )
  }

  if (running) {
    return (
      <StatusBarItem icon={VscDebugAlt}>
        <EllipsisText>Running program</EllipsisText>
      </StatusBarItem>
    )
  }

  if (lastError) {
    return (
      <StatusBarItem icon="NotExecuted" disabled>
        Build failed
      </StatusBarItem>
    )
  }
  return null
}

export const StatusBar: React.FC = () => {
  const status = useSelector(({ status }: State) => status)
  const tabSize = useSelector(({ monaco }: State) => monaco.tabSize)
  const loading = status?.loading
  const running = status?.running
  const lastError = status?.lastError
  const markers = status?.markers
  const cursorPosition = status?.cursorPosition
  const line = cursorPosition?.line ?? 1
  const column = cursorPosition?.column ?? 1

  const { warnings, errors } = useMemo(() => countMarkers(markers), [markers])
  return (
    <>
      <div
        className={clsx(styles.StatusBar, {
          [styles['StatusBar--busy']]: loading || running,
        })}
      >
        <div className={styles['StatusBar__side-left']}>
          <StatusBarItem icon="ErrorBadge" button>
            <StatusBarItemCounter label="Error" value={errors} />
          </StatusBarItem>
          {warnings > 0 ? (
            <StatusBarItem icon="Warning" button>
              <StatusBarItemCounter label="Warning" value={warnings} />
            </StatusBarItem>
          ) : null}
          <VimStatusBarItem />
          {getStatusItem({
            loading,
            running,
            lastError,
          })}
        </div>
        <div className={styles['StatusBar__side-right']}>
          <StatusBarItem>
            Ln {line}, Col {column}
          </StatusBarItem>
          <StatusBarItem mobileHidden>Tab Size: {tabSize}</StatusBarItem>
          <StatusBarItem icon="Feedback" title="Send feedback" href={environment.urls.issue} iconOnly mobileHidden />
          <StatusBarItem icon="VscGithubInverted" title="GitHub" href={environment.urls.github} iconOnly mobileHidden />
        </div>
      </div>
    </>
  )
}
