import React from 'react'

import { Spinner, SpinnerSize } from '@fluentui/react'
import { FlexContainer } from '../FlexContainer'

const styles = {
  flex: '1 1 0%',
  overflow: 'hidden',
  display: 'flex',
  'align-items': 'center',
  'justify-content': 'center',
}

const CodeEditorContainer = React.lazy(() => import('./CodeEditorContainer'))

const CodeEditorPreloader: React.FC = () => (
  <div style={styles}>
    <Spinner key="spinner" label="Loading editor..." size={SpinnerSize.large} labelPosition="bottom" />
  </div>
)

/**
 * Lazy-loading wrapper for code editor container
 */
export const LazyCodeEditorContainer: React.FC = () => {
  return (
    <React.Suspense fallback={<CodeEditorPreloader />}>
      <CodeEditorContainer />
    </React.Suspense>
  )
}
