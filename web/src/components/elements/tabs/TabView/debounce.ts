interface DebounceOpts {
  immediate?: boolean
}

export const debounce = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number,
  opts?: DebounceOpts,
): [T, () => void] => {
  let timeout: NodeJS.Timeout
  let isFirstCall = opts?.immediate ?? false

  const func = (...args: Parameters<T>) => {
    if (isFirstCall) {
      isFirstCall = false
      return callback(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(() => {
      callback(...args)
    }, delay)
  }
  const cleanFunc = () => clearTimeout(timeout)
  return [func as T, cleanFunc]
}
