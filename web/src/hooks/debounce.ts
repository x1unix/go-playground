import { useCallback, useEffect, useRef } from 'react'

/**
 * Returns a debouncer function for callback execution.
 *
 * Every call cancels a previously scheduled callback and schedules a new one
 * to run after `interval` milliseconds.
 *
 * @example
 * const deb = useDebouncer(200)
 * deb(() => console.log('debounced call'))
 */
export const useDebouncer = (interval: number) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef(interval)

  intervalRef.current = interval

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    },
    [],
  )

  return useCallback((fn: () => void) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      fn()
    }, intervalRef.current)
  }, [])
}
