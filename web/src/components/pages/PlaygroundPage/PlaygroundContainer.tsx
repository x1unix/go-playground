import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { type State, dispatchPanelLayoutChange } from '~/store'
import { InspectorPanel } from '~/components/features/inspector/InspectorPanel/InspectorPanel'
import { NotificationHost } from '~/components/modals/Notification'
import { Layout } from '~/components/layout/Layout/Layout'
import { computeSizePercentage } from './utils'

import { ConfirmProvider } from '~/components/modals/ConfirmModal'
import { LazyLoadedWorkspace } from '~/components/features/workspace/Workspace'

export interface PlaygroundContainerProps {
  parentRef: React.RefObject<HTMLElement>
}

const PlaygroundContainer: React.FC<PlaygroundContainerProps> = ({ parentRef }) => {
  const dispatch = useDispatch()
  const panelProps = useSelector<State, State['panel']>((state) => state.panel)
  return (
    <Layout layout={panelProps.layout}>
      <ConfirmProvider>
        <LazyLoadedWorkspace />
        <InspectorPanel
          {...panelProps}
          onLayoutChange={(layout) => {
            dispatch(dispatchPanelLayoutChange({ layout }))
          }}
          onCollapsed={(collapsed) => {
            dispatch(dispatchPanelLayoutChange({ collapsed }))
          }}
          onResize={(changes) => {
            if ('height' in changes) {
              // Height percentage is buggy on resize. Use percents only for width.
              dispatch(dispatchPanelLayoutChange(changes))
              return
            }

            if (!parentRef.current) {
              return
            }

            const result = computeSizePercentage(changes, parentRef.current)
            dispatch(dispatchPanelLayoutChange(result))
          }}
        />
        <NotificationHost />
      </ConfirmProvider>
    </Layout>
  )
}

export default PlaygroundContainer
