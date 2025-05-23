import React, { Suspense, lazy } from 'react'

const AsyncAnnouncementBanner = lazy(async () => {
  const { AnnouncementBanner } = await import('./AnnouncementBanner')
  return { default: AnnouncementBanner }
})

export const LazyAnnouncementBanner: React.FC = () => (
  <Suspense fallback={null}>
    <AsyncAnnouncementBanner />
  </Suspense>
)
