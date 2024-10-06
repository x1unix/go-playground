import React from 'react'

const NotFoundContent = React.lazy(async () => await import('./NotFoundContent.tsx'))

export const NotFoundPage: React.FC = () => (
  <React.Suspense fallback={<span>Loading...</span>}>
    <NotFoundContent />
  </React.Suspense>
)
