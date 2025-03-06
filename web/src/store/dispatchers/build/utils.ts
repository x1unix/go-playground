import { validateResponse } from '~/lib/go'
import client, { type EvalEvent, EvalEventKind } from '~/services/api'
import { SECOND } from '~/utils/duration'
import { wrapResponseWithProgress } from '~/utils/http'

import type { DispatchFn } from '../../helpers'
import { newRemoveNotificationAction, NotificationIDs } from '../../notifications'
import { newProgramWriteAction } from '../../actions'
import { downloadProgressNotification } from './notifications'

/**
 * Go program execution timeout in nanoseconds
 */
export const runTimeoutNs = 5 * SECOND

export const lastElem = <T>(items: T[]): T | undefined => items?.slice(-1)?.[0]

export const hasProgramTimeoutError = (events: EvalEvent[]) => {
  if (events.length === 0) {
    return false
  }

  const { Message, Kind } = events[0]
  if (Kind === 'stderr' && Message.trim() === 'timeout running program') {
    const lastEvent = lastElem(events)
    return (lastEvent?.Delay ?? 0) >= runTimeoutNs
  }

  return false
}

export const fetchWasmWithProgress = async (dispatch: DispatchFn, fileName: string) => {
  try {
    dispatch(downloadProgressNotification())

    let prevRafID = -1
    const rsp = await client.getArtifact(fileName)
    const rspWithProgress = wrapResponseWithProgress(rsp, ({ totalBytes, currentBytes }) => {
      // We want to limit number of emitted events to avoid dozens of re-renders on React side.
      // If renders are too frequent, most of all render queries will be dropped.
      // This results in empty progress bar.
      cancelAnimationFrame(prevRafID)
      prevRafID = requestAnimationFrame(() => {
        dispatch(
          downloadProgressNotification(
            {
              total: totalBytes,
              current: currentBytes,
            },
            true,
          ),
        )
      })
    })

    await validateResponse(rspWithProgress)
    return await rspWithProgress.arrayBuffer()
  } catch (err) {
    dispatch(newRemoveNotificationAction(NotificationIDs.WASMAppDownload))
    throw err
  }
}

const decoder = new TextDecoder()
export const newStdoutHandler = (dispatch: DispatchFn) => {
  return (data: ArrayBufferLike, isStderr: boolean) => {
    dispatch(
      newProgramWriteAction({
        Kind: isStderr ? EvalEventKind.Stderr : EvalEventKind.Stdout,
        Message: decoder.decode(data as ArrayBuffer),
        Delay: 0,
      }),
    )
  }
}
