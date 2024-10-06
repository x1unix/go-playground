import React, { lazy } from 'react'
import { SuspenseBoundary } from '~/components/elements/misc/SuspenseBoundary'

const LazyWorkspace = lazy(async () => await import('./Workspace.tsx'))

export const LazyLoadedWorkspace: React.FC = () => (
  <SuspenseBoundary errorLabel="Failed to load workspace" preloaderText="Loading workspace...">
    <LazyWorkspace />
  </SuspenseBoundary>
)
