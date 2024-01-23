import {saveAs} from 'file-saver';
import {replace} from "connected-react-router";

import client from "~/services/api";
import {DEMO_CODE} from '~/components/features/workspace/props';

import { StateProvider, DispatchFn } from "../helpers";
import { newAddNotificationAction, NotificationType } from "../notifications";
import {
  newFormatCodeAction,
  newErrorAction,
  newImportFileAction,
  newLoadingAction,
  newUIStateChangeAction
} from "../actions";

import { Dispatcher } from "./utils";

export function newImportFileDispatcher(f: File): Dispatcher {
  return (dispatch: DispatchFn, _: StateProvider) => {
    const reader = new FileReader();
    reader.onload = e => {
      const data = e.target?.result as string;
      dispatch(newImportFileAction(f.name, data));
    };

    reader.onerror = e => {
      // TODO: replace with a nice modal
      alert(`Failed to import a file: ${e}`)
    };

    reader.readAsText(f, 'UTF-8');
  };
}

export function newCodeImportDispatcher(name: string, contents: string): Dispatcher {
  return (dispatch: DispatchFn, _: StateProvider) => {
    dispatch(newImportFileAction(`${encodeURIComponent(name)}.go`, contents));
  };
}

export function newSnippetLoadDispatcher(snippetID?: string): Dispatcher {
  return async (dispatch: DispatchFn, _: StateProvider) => {
    if (!snippetID) {
      dispatch(newImportFileAction('prog.go', DEMO_CODE));
      return;
    }

    dispatch(newLoadingAction());
    try {
      console.log('loading snippet %s', snippetID);
      const resp = await client.getSnippet(snippetID);
      const { fileName, code } = resp;
      dispatch(newImportFileAction(fileName, code));
    } catch (err: any) {
      dispatch(newErrorAction(err.message));
    }
  }
}

export const shareSnippetDispatcher: Dispatcher =
  async (dispatch: DispatchFn, getState: StateProvider) => {
    dispatch(newLoadingAction());
    try {
      const { code } = getState().editor;
      const { snippetID } = await client.shareSnippet(code);
      dispatch(newLoadingAction(false));
      dispatch(replace(`/snippet/${snippetID}`));
      dispatch(newUIStateChangeAction({
        shareCreated: true,
        snippetId: snippetID
      }));
    } catch (err: any) {
      dispatch(newErrorAction(err.message));
    }
  };

export const saveFileDispatcher: Dispatcher =
  (dispatch: DispatchFn, getState: StateProvider) => {
    try {
      const { fileName, code } = getState().editor;
      const blob = new Blob([code], {
        type: 'text/plain;charset=utf-8'
      });
      saveAs(blob, fileName);
    } catch (err: any) {
      dispatch(newAddNotificationAction({
        id: 'SAVE_FILE_ERROR',
        type: NotificationType.Error,
        title: 'Failed to save file',
        description: err.toString(),
        canDismiss: true
      }));
    }
  };

export const formatFileDispatcher: Dispatcher =
  async (dispatch: DispatchFn, getState: StateProvider) => {
    dispatch(newLoadingAction());
    try {
      // Format code using GoTip is enabled to support
      // any syntax changes from unstable Go specs.
      const { editor: {code}, runTarget: { backend } } = getState();
      const res = await client.formatCode(code, backend);

      dispatch(newLoadingAction(false));
      if (res.formatted?.length) {
        dispatch(newFormatCodeAction(res.formatted));
      }
    } catch (err: any) {
      dispatch(newErrorAction(err.message));
    }
  };
