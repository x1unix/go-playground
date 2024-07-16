import { TargetType } from '~/services/config'
import { getImportObject, goRun } from '~/services/go'
import { setTimeoutNanos, SECOND } from '~/utils/duration'
import { instantiateStreaming } from '~/lib/go'
import { buildGoTestFlags, requiresWasmEnvironment } from '~/lib/sourceutil'
import client, { type EvalEvent, EvalEventKind } from '~/services/api'
import { isProjectRequiresGoMod, goModFile, goModTemplate } from '~/services/examples'

import { type DispatchFn, type StateProvider } from '../helpers'
import {
  newAddNotificationAction,
  newRemoveNotificationAction,
  NotificationType,
  NotificationIDs,
} from '../notifications'
import {
  newErrorAction,
  newLoadingAction,
  newProgramFinishAction,
  newProgramStartAction,
  newProgramWriteAction,
} from '../actions'

import { type Dispatcher } from './utils'
import { wrapResponseWithProgress } from '~/utils/http'
import { type BulkFileUpdatePayload, type FileUpdatePayload, WorkspaceAction } from '~/store/workspace/actions'

/**
 * Go program execution timeout in nanoseconds
 */
const runTimeoutNs = 5 * SECOND

const lastElem = <T>(items: T[]): T | undefined => items?.slice(-1)?.[0]

const hasProgramTimeoutError = (events: EvalEvent[]) => {
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

const fetchWasmWithProgress = async (dispatch: DispatchFn, fileName: string) => {
  try {
    dispatch(
      newAddNotificationAction({
        id: NotificationIDs.WASMAppDownload,
        type: NotificationType.Info,
        title: 'Downloading compiled program',
        canDismiss: false,
        progress: {
          indeterminate: true,
        },
      }),
    )

    const rsp = await client.getArtifact(fileName)
    const rspWithProgress = wrapResponseWithProgress(rsp, ({ totalBytes, currentBytes }) => {
      dispatch(
        newAddNotificationAction({
          id: NotificationIDs.WASMAppDownload,
          type: NotificationType.Info,
          title: 'Downloading compiled application',
          canDismiss: false,
          progress: {
            total: totalBytes,
            current: currentBytes,
          },
        }),
      )
    })

    return await instantiateStreaming(rspWithProgress, getImportObject())
  } catch (err) {
    dispatch(newRemoveNotificationAction(NotificationIDs.WASMAppDownload))
    throw err
  }
}

export const runFileDispatcher: Dispatcher = async (dispatch: DispatchFn, getState: StateProvider) => {
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
      dispatch(
        newAddNotificationAction({
          id: NotificationIDs.GoModMissing,
          type: NotificationType.Error,
          title: 'Go.mod file is missing',
          description: 'Go.mod file is required to import sub-packages.',
          canDismiss: true,
          actions: [
            {
              key: 'ok',
              label: 'Create go.mod',
              primary: true,
              onClick: () => {
                dispatch<FileUpdatePayload[]>({
                  type: WorkspaceAction.ADD_FILE,
                  payload: [
                    {
                      filename: goModFile,
                      content: goModTemplate,
                    },
                  ],
                })
              },
            },
          ],
        }),
      )
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
      dispatch(
        newAddNotificationAction({
          id: NotificationIDs.GoTargetSwitched,
          type: NotificationType.Warning,
          title: 'Go environment temporarily changed',
          description: 'This program will be executed using WebAssembly as Go program contains "//go:build" tag.',
          canDismiss: true,
          actions: [
            {
              key: 'ok',
              label: 'Ok',
              primary: true,
              onClick: () => dispatch(newRemoveNotificationAction(NotificationIDs.GoTargetSwitched)),
            },
          ],
        }),
      )
    }

    switch (runTarget) {
      case TargetType.Server: {
        // TODO: vet
        const res = await client.run(files, false, backend)
        dispatchEvalEvents(dispatch, res.events)
        break
      }
      case TargetType.WebAssembly: {
        const buildResponse = await client.build(files)

        const instance = await fetchWasmWithProgress(dispatch, buildResponse.fileName)
        dispatch(newRemoveNotificationAction(NotificationIDs.WASMAppDownload))
        dispatch(newProgramStartAction())

        const argv = buildGoTestFlags(buildResponse)
        goRun(instance, argv)
          .then((result) => {
            console.log('exit code: %d', result)
          })
          .catch((err) => {
            dispatch(
              newAddNotificationAction({
                id: NotificationIDs.WASMAppExitError,
                type: NotificationType.Error,
                title: 'Failed to run WebAssembly program',
                description: err.toString(),
                canDismiss: true,
              }),
            )
          })
          .finally(() => dispatch(newProgramFinishAction()))
        break
      }
      default:
        dispatch(newErrorAction(`AppError: Unknown Go runtime type "${runTarget}"`))
    }
  } catch (err: any) {
    dispatch(newErrorAction(err.message))
  }
}

export const createGoConsoleAdapter = (dispatch: DispatchFn) => ({
  log: (eventType: EvalEventKind, message: string) => {
    dispatch(
      newProgramWriteAction({
        Kind: eventType,
        Message: message,
        Delay: 0,
      }),
    )
  },
})

export const createGoLifecycleAdapter = (dispatch: DispatchFn) => ({
  onExit: (code: number) => {
    dispatch(newProgramFinishAction())

    if (isNaN(code) || code === 0) {
      return
    }

    dispatch(
      newAddNotificationAction({
        id: NotificationIDs.WASMAppExitError,
        type: NotificationType.Warning,
        title: 'Go program finished',
        description: `Go program exited with non zero code: ${code}`,
        canDismiss: true,
      }),
    )
  },
})
