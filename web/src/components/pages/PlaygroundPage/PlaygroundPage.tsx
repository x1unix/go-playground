import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { connect } from 'react-redux'

import { dispatchPanelLayoutChange } from '~/store'
import { dispatchLoadSnippet } from '~/store/workspace'
import { Header } from '~/components/layout/Header'
import { ConnectedWorkspace } from '~/components/features/workspace/Workspace'
import { InspectorPanel } from '~/components/features/inspector/InspectorPanel/InspectorPanel'
import { NotificationHost } from '~/components/modals/Notification'
import { Layout } from '~/components/layout/Layout/Layout'
import { ConnectedStatusBar } from '~/components/layout/StatusBar'

import styles from './PlaygroundPage.module.css'

interface PageParams {
  snippetID: string
}

export const PlaygroundPage = connect(({ panel }: any) => ({ panelProps: panel }))(({ panelProps, dispatch }: any) => {
  const { snippetID } = useParams<PageParams>()
  useEffect(() => {
    dispatch(dispatchLoadSnippet(snippetID))
  }, [snippetID, dispatch])

  return (
    <div className={styles.Playground}>
      <Header />
      <Layout layout={panelProps.layout}>
        <ConnectedWorkspace />
        <InspectorPanel
          {...panelProps}
          onViewChange={(changes) => {
            dispatch(dispatchPanelLayoutChange(changes))
          }}
        />
        <NotificationHost />
      </Layout>
      <ConnectedStatusBar />
    </div>
  )
})
