import { TargetType } from '~/services/config'
import { SECOND, setTimeoutNanos } from '~/utils/duration'
import { createStdio, GoProcess } from '~/workers/go/client'
import { buildGoTestFlags, requiresWasmEnvironment } from '~/lib/sourceutil'
import client, { type EvalEvent, EvalEventKind, type RequestOpts, isCFError } from '~/services/api'
import { isProjectRequiresGoMod } from '~/services/examples'

import type { DispatchFn, StateProvider } from '../../helpers'
import { newRemoveNotificationAction, NotificationIDs } from '../../notifications'
import {
  newCFChallengeAction,
  newErrorAction,
  newLoadingAction,
  newProgramFinishAction,
  newProgramStartAction,
  newProgramWriteAction,
} from '../../actions'

import { type Dispatcher } from '../utils'
import { type BulkFileUpdatePayload, WorkspaceAction } from '~/store/workspace/actions'
import { fetchWasmWithProgress, lastElem, hasProgramTimeoutError, newStdoutHandler, runTimeoutNs } from './utils'
import {
  goModMissingNotification,
  goEnvChangedNotification,
  goProgramExitNotification,
  wasmErrorNotification,
} from './notifications'

const dispatchEvalEvents = (dispatch: DispatchFn, events: EvalEvent[]) => {
  // TODO: support cancellation
  dispatch(newProgramStartAction())

  if (!events?.length) {
    dispatch(newProgramFinishAction())
    return
  }

  // Each eval event contains time since previous event.
  // Convert relative delay into absolute delay since program start.
  let eventsWithDelay = events.reduce(
    (accum: EvalEvent[], { Delay: delay, ...item }) => [
      ...accum,
      {
        ...item,
        Delay: (lastElem(accum)?.Delay ?? 0) + delay,
      },
    ],
    [],
  )

  // Sometimes Go playground fails to detect execution timeout error and still sends all events.
  // This dirty hack attempts to normalize this case.
  if (hasProgramTimeoutError(eventsWithDelay)) {
    eventsWithDelay = eventsWithDelay
      .slice(1)
      .filter(({ Delay }) => Delay <= runTimeoutNs)
      .concat({
        Kind: EvalEventKind.Stderr,
        Message: `Go program execution timeout exceeded (max: ${runTimeoutNs / SECOND}s)`,
        Delay: runTimeoutNs,
      })
  }

  // Try to guess program end time by checking last message delay.
  //
  // This won't work if "time.Sleep()" occurs after final message but the same
  // approach used in official playground, so should be enough for us.
  const programEndTime = lastElem(eventsWithDelay)?.Delay ?? 0

  eventsWithDelay.forEach((event) => {
    setTimeoutNanos(() => {
      dispatch(newProgramWriteAction(event))
    }, event.Delay)
  })

  setTimeoutNanos(() => {
    dispatch(newProgramFinishAction())
  }, programEndTime)
}

export const runFileWithParamsDispatcher = (opts?: RequestOpts): Dispatcher => {
  return (dispatch, getState) => runFileDispatcher(dispatch, getState, opts)
}

export const runFileDispatcher = async (dispatch: DispatchFn, getState: StateProvider, opts?: RequestOpts) => {
  dispatch(newRemoveNotificationAction(NotificationIDs.WASMAppExitError))
  dispatch(newRemoveNotificationAction(NotificationIDs.GoModMissing))

  try {
    const {
      settings,
      workspace,
      runTarget: { target: selectedTarget, backend },
    } = getState()

    let { files, selectedFile } = workspace
    if (!files || !selectedFile) {
      dispatch(newErrorAction('No Go files'))
      return
    }

    if (isProjectRequiresGoMod(files)) {
      dispatch(goModMissingNotification(dispatch))
      return
    }

    dispatch(newLoadingAction())
    if (settings.autoFormat) {
      const rsp = await client.format(files, backend)
      files = rsp.files
      dispatch<BulkFileUpdatePayload>({
        type: WorkspaceAction.UPDATE_FILES,
        payload: rsp.files,
      })
    }

    // Force use WebAssembly for execution if source code contains go:build constraints.
    let runTarget = selectedTarget
    if (runTarget !== TargetType.WebAssembly && requiresWasmEnvironment(files)) {
      runTarget = TargetType.WebAssembly
      dispatch(goEnvChangedNotification(dispatch))
    }

    switch (runTarget) {
      case TargetType.Server: {
        // TODO: vet
        const res = await client.run(files, false, backend, opts)
        dispatchEvalEvents(dispatch, res.events)
        break
      }
      case TargetType.WebAssembly: {
        const buildResponse = await client.build(files, opts)

        const buff = await fetchWasmWithProgress(dispatch, buildResponse.fileName)
        dispatch(newRemoveNotificationAction(NotificationIDs.WASMAppDownload))
        dispatch(newProgramStartAction())

        const args = buildGoTestFlags(buildResponse)
        const stdio = createStdio(newStdoutHandler(dispatch))
        const proc = new GoProcess()
        proc
          .start(buff, stdio, {
            args,
          })
          .then((code) => {
            if (isNaN(code) || code === 0) {
              return
            }

            dispatch(goProgramExitNotification(code))
          })
          .catch((err) => {
            dispatch(wasmErrorNotification(err))
          })
          .finally(() => {
            // This dispatch may be skipped if fired immediately after last console write.
            // HACK: defer finish action to write it only after last log was written.
            requestAnimationFrame(() => {
              proc.terminate()
              dispatch(newProgramFinishAction())
            })
          })
        break
      }
      default:
        dispatch(newErrorAction(`AppError: Unknown Go runtime type "${runTarget}"`))
    }
  } catch (err: any) {
    if (isCFError(err)) {
      dispatch(newCFChallengeAction())
      return
    }
    dispatch(newErrorAction(err.message))
  }
}
