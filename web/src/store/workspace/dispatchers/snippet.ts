import { replace } from 'connected-react-router';
import type {DispatchFn, StateProvider} from '~/store/helpers';
import client from '~/services/api';
import {
  newAddNotificationAction,
  newNotificationId,
  newRemoveNotificationAction,
  NotificationType,
} from '~/store/notifications';
import { newLoadingAction, newErrorAction, newUIStateChangeAction } from '~/store/actions/ui';
import { type SnippetLoadPayload, type FileUpdatePayload, WorkspaceAction } from '../actions';
import { loadWorkspaceState } from '../config';

export const dispatchLoadSnippet = (snippetId: string | null) => (
  async (dispatch: DispatchFn, _: StateProvider) => {
    if (!snippetId) {
      dispatch({
        type: WorkspaceAction.WORKSPACE_IMPORT,
        payload: loadWorkspaceState(),
      });
      return;
    }

    dispatch({
      type: WorkspaceAction.SNIPPET_LOAD_START,
      payload: snippetId,
    });

    try {
      // TODO: use APIv2
      const { fileName, code } = await client.getSnippet(snippetId);
      dispatch<SnippetLoadPayload>({
        type: WorkspaceAction.SNIPPET_LOAD_FINISH,
        payload: {
          id: snippetId,
          error: null,
          files: {
            [fileName]: code,
          },
        }
      });
    } catch (err: any) {
      dispatch<SnippetLoadPayload>({
        type: WorkspaceAction.SNIPPET_LOAD_FINISH,
        payload: {
          id: snippetId,
          error: err.message,
        }
      });
    }
  }
);

export const dispatchShareSnippet = () => (
  async (dispatch: DispatchFn, getState: StateProvider) => {
    const notificationId = newNotificationId();
    const { workspace } = getState();

    if (!workspace.files) {
      dispatch(newAddNotificationAction({
        id: notificationId,
        type: NotificationType.Warning,
        title: 'Share snippet',
        description: 'Workspace is empty, nothing to share.',
        canDismiss: true,
      }));
      return;
    }

    dispatch(newLoadingAction());
    dispatch(newAddNotificationAction({
      id: notificationId,
      type: NotificationType.Info,
      title: 'Share snippet',
      description: 'Saving snippet...',
      canDismiss: false,
      progress: {
        indeterminate: true,
      }
    }));

    try {
      // TODO: use APIv2
      const { files } = workspace;
      const fileName = Object.keys(files)[0];
      const code = files[fileName];
      const { snippetID } = await client.shareSnippet(code);
      dispatch(newRemoveNotificationAction(notificationId));
      dispatch(replace(`/snippet/${snippetID}`));
      dispatch(newUIStateChangeAction({
        shareCreated: true,
        snippetId: snippetID
      }));
      dispatch({
        type: WorkspaceAction.WORKSPACE_IMPORT,
        payload: {
          ...workspace,
          snippet: {
            id: snippetID,
          }
        }
      });
    } catch (err) {
      dispatch(newAddNotificationAction({
        id: notificationId,
        type: NotificationType.Error,
        title: 'Failed to share snippet',
        description: `${err}`,
        canDismiss: true,
      }));
    } finally {
      dispatch(newLoadingAction(false));
    }
  }
);

export const dispatchFormatFile = () => (
  async (dispatch: DispatchFn, getState: StateProvider) => {
    const {
      workspace: { files, selectedFile },
      runTarget: { backend }
    } = getState();
    if (!files || !selectedFile) {
      return;
    }

    dispatch(newLoadingAction());
    try {
      // Format code using GoTip is enabled to support
      // any syntax changes from unstable Go specs.
      const code = files[selectedFile];
      const rsp = await client.formatCode(code, backend);

      if (rsp.formatted?.length) {
        dispatch<FileUpdatePayload>({
          type: WorkspaceAction.UPDATE_FILE,
          payload: {
            filename: selectedFile,
            content: rsp.formatted,
          }
        });
      }
    } catch (err: any) {
      dispatch(newErrorAction(err.message));
    } finally {
      dispatch(newLoadingAction(false));
    }
  }
);
