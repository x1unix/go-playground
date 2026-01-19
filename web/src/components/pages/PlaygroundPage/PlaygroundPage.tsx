import React, { lazy, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch } from 'react-redux'

import { dispatchLoadSnippet } from '~/store/workspace'
import { Header } from '~/components/layout/Header'
import { ConnectedStatusBar } from '~/components/layout/StatusBar'

import styles from './PlaygroundPage.module.css'
import { SuspenseBoundary } from '~/components/elements/misc/SuspenseBoundary'
import { LazyAnnouncementBanner } from '~/components/layout/AnnouncementBanner'

const LazyPlaygroundContent = lazy(async () => await import('./PlaygroundContainer.tsx'))

interface PageParams {
  snippetID: string
}

export const PlaygroundPage: React.FC = () => {
  const dispatch = useDispatch()
  const containerRef = useRef<HTMLDivElement>(null)
  const { snippetID } = useParams<PageParams>()
  useEffect(() => {
    dispatch(dispatchLoadSnippet(snippetID))
  }, [snippetID, dispatch])

  return (
    <div ref={containerRef} className={styles.Playground}>
      <LazyAnnouncementBanner />
      <Header />
      <SuspenseBoundary errorLabel="Failed to load workspace" preloaderText="Loading workspace...">
        <LazyPlaygroundContent parentRef={containerRef} />
      </SuspenseBoundary>
      <ConnectedStatusBar />
    </div>
  )
}
