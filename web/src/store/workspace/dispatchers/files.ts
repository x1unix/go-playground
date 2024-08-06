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

let saveTimeout: NodeJS.Timeout
const cancelPendingAutosave = () => {
  clearTimeout(saveTimeout)
}
const scheduleAutosave = (getState: StateProvider) => {
  cancelPendingAutosave()
  saveTimeout = setTimeout(() => {
    const {
      workspace: { snippet, ...wp },
    } = getState()

    saveWorkspaceState(wp)
  }, AUTOSAVE_INTERVAL)
}

const fileNamesFromState = (getState: StateProvider) => {
  const { workspace } = getState()
  return workspace.files ? Object.keys(workspace.files) : []
}

import { updateWorkspaceNameAction } from '../actions'
import { db } from '~/store/db/db';

export const dispatchUpdateWorkspaceName = (name: string) => (dispatch: DispatchFn) => {
  dispatch(updateWorkspaceNameAction(name))
}

export const dispatchSaveWorkspace = (name: string) => async (dispatch: DispatchFn, getState: StateProvider) => {
  const s = getState();
  const { workspace } = s;

  workspace.name = name;

  try {
    await db.saveWorkspace(workspace);
    dispatch(updateWorkspaceNameAction(name));
    scheduleAutosave(getState);
  } catch (err) {
    dispatch(
      newAddNotificationAction({
        id: newNotificationId(),
        type: NotificationType.Error,
        title: 'Failed to save workspace',
        description: `${err}`,
        canDismiss: true,
      }),
    )
  }
};

export const dispatchLoadWorkspace = (name: string) => async (dispatch: DispatchFn) => {
  try {
    const workspace = await db.getWorkspaceByName(name);
    if (workspace) {
      dispatch({
        type: WorkspaceAction.WORKSPACE_IMPORT,
        payload: workspace,
      });
    }
  } catch (err) {
    dispatch(
      newAddNotificationAction({
        id: newNotificationId(),
        type: NotificationType.Error,
        title: 'Failed to load workspace',
        description: `${err}`,
        canDismiss: true,
      }),
    );
  }
};

export const dispatchDeleteWorkspace = (name: string) => async (dispatch: DispatchFn) => {
  try {
    await db.deleteWorkspace(name);
  } catch (err) {
    dispatch(
      newAddNotificationAction({
        id: newNotificationId(),
        type: NotificationType.Error,
        title: 'Failed to delete workspace',
        description: `${err}`,
        canDismiss: true,
      }),
    );
  }
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

  scheduleAutosave(getState)
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

    scheduleAutosave(getState)
  }

export const dispatchRemoveFile = (filename: string) => (dispatch: DispatchFn, getState: StateProvider) => {
  dispatch({
    type: WorkspaceAction.REMOVE_FILE,
    payload: { filename },
  })

  scheduleAutosave(getState)
}

export const dispatchUpdateFile =
  (filename: string, content: string) => (dispatch: DispatchFn, getState: StateProvider) => {
    dispatch({
      type: WorkspaceAction.UPDATE_FILE,
      payload: { filename, content },
    })

    scheduleAutosave(getState)
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

