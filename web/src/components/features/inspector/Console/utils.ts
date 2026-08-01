import type { EvalEvent } from '~/services/api'

export const createDebounceResizeObserver = (callback: () => void, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null

  return new ResizeObserver(() => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(callback, delay)
  })
}

export const isEventPrefix = (prefix: EvalEvent[], events: EvalEvent[]) =>
  prefix.length <= events.length &&
  prefix.every(
    ({ Kind, Message, Delay }, index) =>
      Kind === events[index]?.Kind && Message === events[index]?.Message && Delay === events[index]?.Delay,
  )
