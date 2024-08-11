import { replace } from 'connected-react-router'
import type { DispatchFn, StateProvider } from '~/store/helpers'
import client from '~/services/api'
import { getSnippetFromSource, type SnippetSource } from '~/services/examples'
import {
  newAddNotificationAction,
  newNotificationId,
  newRemoveNotificationAction,
  NotificationIDs,
  NotificationType,
} from '~/store/notifications'
import { newLoadingAction, newErrorAction, newUIStateChangeAction } from '~/store/actions/ui'
import { type SnippetLoadPayload, WorkspaceAction, type BulkFileUpdatePayload } from '../actions'
import { loadWorkspaceState } from '../config'
import { getDefaultWorkspaceState } from '../state'

/**
 * Dispatch snippet load from a predefined source.
 * Used to load examples hosted as static files.
 * @param source
 */
export const dispatchLoadSnippetFromSource = (source: SnippetSource) => async (dispatch: DispatchFn) => {
  dispatch(newRemoveNotificationAction(NotificationIDs.GoModMissing))
  dispatch({
    type: WorkspaceAction.SNIPPET_LOAD_START,
    payload: source.basePath,
  })

  try {
    const files = await getSnippetFromSource(source)
    dispatch<SnippetLoadPayload>({
      type: WorkspaceAction.SNIPPET_LOAD_FINISH,
      payload: {
        id: source.basePath,
        error: null,
        files,
      },
    })
  } catch (err: any) {
    dispatch<SnippetLoadPayload>({
      type: WorkspaceAction.SNIPPET_LOAD_FINISH,
      payload: {
        id: source.basePath,
        error: `${err.message}`,
      },
    })
  }
}

/**
 * Dispatch snippet load from a snippet ID.
 * Loads shared snippets from Go Playground API.
 * @param snippetId
 */
export const dispatchLoadSnippet =
  (snippetId: string | null) => async (dispatch: DispatchFn, getState: StateProvider) => {
    if (!snippetId) {
      const {
        settings: { autoSave },
        workspace: { snippet },
      } = getState()

      const shouldAutosave = autoSave && !snippet?.id
      dispatch({
        type: WorkspaceAction.WORKSPACE_IMPORT,
        payload: shouldAutosave ? loadWorkspaceState() : getDefaultWorkspaceState(),
      })
      return
    }

    dispatch(newRemoveNotificationAction(NotificationIDs.GoModMissing))
    const {
      workspace: { snippet },
      ui,
    } = getState()
    if (ui?.shareCreated && snippet?.id === snippetId) {
      // Prevent loading the same snippet again if it was just shared.
      return
    }

    dispatch({
      type: WorkspaceAction.SNIPPET_LOAD_START,
      payload: snippetId,
    })

    try {
      const { files } = await client.getSnippet(snippetId)
      dispatch<SnippetLoadPayload>({
        type: WorkspaceAction.SNIPPET_LOAD_FINISH,
        payload: {
          id: snippetId,
          error: null,
          files,
        },
      })
    } catch (err: any) {
      dispatch<SnippetLoadPayload>({
        type: WorkspaceAction.SNIPPET_LOAD_FINISH,
        payload: {
          id: snippetId,
          error: err.message,
        },
      })
    }
  }

export const dispatchShareSnippet = () => async (dispatch: DispatchFn, getState: StateProvider) => {
  const notificationId = newNotificationId()
  const { workspace } = getState()

  if (!workspace.files) {
    dispatch(
      newAddNotificationAction({
        id: notificationId,
        type: NotificationType.Warning,
        title: 'Share snippet',
        description: 'Workspace is empty, nothing to share.',
        canDismiss: true,
      }),
    )
    return
  }

  dispatch(newLoadingAction())
  dispatch(
    newAddNotificationAction({
      id: notificationId,
      type: NotificationType.Info,
      title: 'Share snippet',
      description: 'Saving snippet...',
      canDismiss: false,
      progress: {
        indeterminate: true,
      },
    }),
  )

  try {
    const { files } = workspace
    const { snippetID } = await client.shareSnippet(files)
    dispatch(newRemoveNotificationAction(notificationId))
    dispatch(
      newUIStateChangeAction({
        shareCreated: true,
        snippetId: snippetID,
      }),
    )
    dispatch({
      type: WorkspaceAction.WORKSPACE_IMPORT,
      payload: {
        ...workspace,
        snippet: {
          id: snippetID,
        },
      },
    })
    dispatch(replace(`/snippet/${snippetID}`, getState()))
  } catch (err) {
    dispatch(
      newAddNotificationAction({
        id: notificationId,
        type: NotificationType.Error,
        title: 'Failed to share snippet',
        description: `${err}`,
        canDismiss: true,
      }),
    )
  } finally {
    dispatch(newLoadingAction(false))
  }
}

export const dispatchFormatFile = () => async (dispatch: DispatchFn, getState: StateProvider) => {
  const {
    workspace: { files },
    runTarget: { backend },
  } = getState()
  if (!files) {
    return
  }

  dispatch(newLoadingAction())
  try {
    const { files: formattedFiles } = await client.format(files, backend)

    dispatch<BulkFileUpdatePayload>({
      type: WorkspaceAction.UPDATE_FILES,
      payload: formattedFiles,
    })
  } catch (err: any) {
    dispatch(newErrorAction(err.message))
  } finally {
    dispatch(newLoadingAction(false))
  }
}
