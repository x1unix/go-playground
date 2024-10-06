/**
 * Wraps async function with debounce timer.
 *
 * @param fn Function
 * @param delay Debounce time
 */
export const asyncDebounce = <T>(fn: (...args) => Promise<T>, delay: number) => {
  let lastTimeoutId: NodeJS.Timeout | null = null

  return async (...args) => {
    if (lastTimeoutId) {
      clearTimeout(lastTimeoutId)
    }

    return await new Promise<T>((resolve, reject) => {
      lastTimeoutId = setTimeout(() => {
        fn(...args)
          .then(resolve)
          .catch(reject)
      }, delay)
    })
  }
}

/**
 * Wraps passed function with a debouncer
 */
export const debounce = <T>(fn: (...args) => T, delay: number) => {
  let lastTimeoutId: NodeJS.Timeout | null = null

  return (...args) => {
    if (lastTimeoutId) {
      clearTimeout(lastTimeoutId)
    }

    lastTimeoutId = setTimeout(() => fn(...args), delay)
  }
}
