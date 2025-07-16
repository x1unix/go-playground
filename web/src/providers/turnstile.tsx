import React, { createContext, useMemo } from 'react'

export interface TurnstileContextValue {
  siteKey: string | null
}

export const TurnstileContext = createContext<TurnstileContextValue | null>(null)

export const TurnstileProvider: React.FC = ({ children }) => {
  const contextValue = useMemo(() => {
    const metaTag = document.querySelector('meta[name="turnstile"]')
    const siteKey = metaTag?.getAttribute('content') ?? import.meta.env.VITE_TURNSTILE_SITE_KEY

    if (!siteKey?.length) {
      return null
    }

    return { siteKey }
  }, [])

  return <TurnstileContext.Provider value={contextValue}>{children}</TurnstileContext.Provider>
}
