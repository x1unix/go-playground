import React, { useEffect, useState } from 'react'
import { useTheme } from '@fluentui/react'
import { addDays } from 'date-fns'
import { useDispatch, useSelector } from 'react-redux'

import { newAddNotificationAction, NotificationType } from '~/store/notifications'
import { keyValue } from '~/services/storage'
import apiClient, { type VersionsInfo } from '~/services/api'

import classes from './Header.module.css'

const goVersionsCacheEntry = {
  key: 'api.go.versions',
  ttl: () => addDays(new Date(), 7),
  getInitialValue: async () => await apiClient.getBackendVersions(),
}

export const Header = () => {
  const dispatch = useDispatch()
  const theme = useTheme()
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

  return (
    <header className={classes.Header}>
      <div className={classes['Header--left']}></div>
      <div className={classes['Header--left']}></div>
    </header>
  )
}
