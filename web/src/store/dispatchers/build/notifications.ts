import { formatBytes } from '~/utils/format'
import { type FileUpdatePayload, WorkspaceAction } from '~/store/workspace/actions'
import { goModFile, goModTemplate } from '~/services/examples'
import {
  type NotificationProgress,
  NotificationIDs,
  NotificationType,
  newAddNotificationAction,
  newRemoveNotificationAction,
} from '../../notifications'
import type { DispatchFn } from '../../helpers'

export const goModMissingNotification = (dispatch: DispatchFn) =>
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
  })

export const goEnvChangedNotification = (dispatch: DispatchFn) =>
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
  })

export const goProgramExitNotification = (code: number) =>
  newAddNotificationAction({
    id: NotificationIDs.WASMAppExitError,
    type: NotificationType.Warning,
    title: 'Go program finished',
    description: `Go program exited with non zero code: ${code}`,
    canDismiss: true,
  })

export const wasmErrorNotification = (err: any) =>
  newAddNotificationAction({
    id: NotificationIDs.WASMAppExitError,
    type: NotificationType.Error,
    title: 'Failed to run WebAssembly program',
    description: err.toString(),
    canDismiss: true,
  })

export const downloadProgressNotification = (
  progress?: Required<Pick<NotificationProgress, 'total' | 'current'>>,
  updateOnly?: boolean,
) =>
  newAddNotificationAction(
    {
      id: NotificationIDs.WASMAppDownload,
      type: NotificationType.Info,
      title: 'Downloading compiled application',
      description: progress ? `${formatBytes(progress.current)} / ${formatBytes(progress.total)}` : undefined,
      canDismiss: false,
      progress: progress ?? {
        indeterminate: true,
      },
    },
    updateOnly,
  )
