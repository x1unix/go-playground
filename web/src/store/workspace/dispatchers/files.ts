import type { DispatchFn, StateProvider } from '~/store/helpers'
import type { Action } from '~/store/actions'
import {
  type Notification,
  NotificationType,
  newNotificationId,
  newAddNotificationAction,
  newAddNotificationsAction,
} from '~/store/notifications'

import { saveWorkspaceState } from '../config'
import { WorkspaceAction, type FileUpdatePayload, type FilePayload } from '../actions'
import { readFile, dedupFiles } from './utils'
import { type WorkspaceState, defaultFiles } from '../state'

const AUTOSAVE_INTERVAL = 1000

const isAutosaveEnabled = (getState: StateProvider) => {
  const { settings } = getState()
  return settings.autoSave
}

let saveTimeout: NodeJS.Timeout

const cancelPendingAutosave = () => {
  clearTimeout(saveTimeout)
}

const scheduleWorkspaceAutosave = (getState: StateProvider) => {
  cancelPendingAutosave()
  if (!isAutosaveEnabled(getState)) {
    return
  }

  saveTimeout = setTimeout(() => {
    const {
      settings: { autoSave },
      workspace: { snippet, ...wp },
    } = getState()
    if (snippet?.id || !autoSave) {
      // abort autosave when loaded external snippet.
      return
    }

    saveWorkspaceState(wp)
  }, AUTOSAVE_INTERVAL)
}

const fileNamesFromState = (getState: StateProvider) => {
  const { workspace } = getState()
  return workspace.files ? Object.keys(workspace.files) : []
}

/**
 * Reads and imports files to a workspace.
 * File names are deduplicated.
 *
 * @param files
 */
export const dispatchImportFile = (files: FileList) => async (dispatch: DispatchFn, getState: StateProvider) => {
  const existingNames = new Set(fileNamesFromState(getState))
  const filePayloads: FileUpdatePayload[] = []
  const errors: Notification[] = []

  // We can't control if user won't select multiple files with identical names.
  let dedupFailures = 0
  const iter = dedupFiles(files, existingNames, () => dedupFailures++)
  for (const file of iter) {
    try {
      filePayloads.push(await readFile(file))
    } catch (err) {
      errors.push({
        id: newNotificationId(),
        type: NotificationType.Error,
        title: `Failed to import "${file.name}"`,
        description: `${err}`,
        canDismiss: true,
      })
    }
  }

  if (dedupFailures) {
    errors.push({
      id: newNotificationId(),
      type: NotificationType.Error,
      title: 'Error during file import',
      description: `Failed to deduplicate ${dedupFailures} identical file names.`,
      canDismiss: true,
    })
  }

  if (errors.length > 0) {
    dispatch(newAddNotificationsAction(errors))
  }

  if (filePayloads.length > 0) {
    dispatch({
      type: WorkspaceAction.ADD_FILE,
      payload: filePayloads,
    })
  }

  scheduleWorkspaceAutosave(getState)
}

export const dispatchCreateFile =
  (filename: string, content: string) => (dispatch: DispatchFn, getState: StateProvider) => {
    const existingNames = new Set(fileNamesFromState(getState))
    if (existingNames.has(filename)) {
      dispatch(
        newAddNotificationAction({
          id: newNotificationId(),
          type: NotificationType.Error,
          title: 'File already exists',
          description: `File "${filename}" already exists in workspace.`,
          canDismiss: true,
        }),
      )
      return
    }

    dispatch({
      type: WorkspaceAction.ADD_FILE,
      payload: [{ filename, content }],
    })

    scheduleWorkspaceAutosave(getState)
  }

export const dispatchRemoveFile = (filename: string) => (dispatch: DispatchFn, getState: StateProvider) => {
  dispatch({
    type: WorkspaceAction.REMOVE_FILE,
    payload: { filename },
  })

  scheduleWorkspaceAutosave(getState)
}

export const dispatchUpdateFile =
  (filename: string, content: string) => (dispatch: DispatchFn, getState: StateProvider) => {
    dispatch({
      type: WorkspaceAction.UPDATE_FILE,
      payload: { filename, content },
    })

    scheduleWorkspaceAutosave(getState)
  }

export const dispatchImportSource = (files: Record<string, string>) => (dispatch: DispatchFn, _: StateProvider) => {
  const selectedFile = Object.keys(files)[0]
  dispatch<WorkspaceState>({
    type: WorkspaceAction.WORKSPACE_IMPORT,
    payload: {
      selectedFile,
      files,
    },
  })
}

export const newFileSelectAction = (filename: string): Action<FilePayload> => ({
  type: WorkspaceAction.SELECT_FILE,
  payload: {
    filename,
  },
})

export const dispatchResetWorkspace = dispatchImportSource(defaultFiles)
