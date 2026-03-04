import { useRef } from 'react'

/**
 * Acts as `useRef`, but accepts a constructor function.
 */
export const useLazyRef = <T>(ctor: () => T) => {
  const ref = useRef<T | null>(null)

  if (ref.current === null) {
    ref.current = ctor()
  }

  return ref as React.MutableRefObject<T>
}
