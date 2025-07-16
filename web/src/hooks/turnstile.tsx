import { useContext } from 'react'

import { type TurnstileContextValue, TurnstileContext } from '~/providers/turnstile'

export const useTurnstile = (): TurnstileContextValue | null => {
  const ctx = useContext(TurnstileContext)
  if (!ctx) {
    return null
  }

  return ctx
}
