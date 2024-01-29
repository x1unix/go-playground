import { mapByAction } from '../helpers';
import type { Action } from '../actions';

import type { WorkspaceState } from './types';
import {
  WorkspaceAction,
  type FileUpdatePayload,
  type FilePayload,
  type SnippetLoadPayload,
} from './actions';
import { initialWorkspaceState } from './state';

export const reducers = mapByAction<WorkspaceState>({
  [WorkspaceAction.ADD_FILE]: (s: WorkspaceState, { payload: { filename, content } }: Action<FileUpdatePayload>) => {
    const { files = {}, ...rest } = s;
    return {
      ...rest,
      selectedFile: filename,
      files: {
        ...files,
        [filename]: content,
      },
    };
  },
  [WorkspaceAction.UPDATE_FILE]: (s: WorkspaceState, { payload: { filename, content } }: Action<FileUpdatePayload>) => {
    const { files = {}, ...rest } = s;
    return {
      ...rest,
      files: {
        ...files,
        [filename]: content,
      },
    };
  },
  [WorkspaceAction.REMOVE_FILE]: (s: WorkspaceState, { payload: { filename } }: Action<FilePayload>) => {
    const { files = {}, ...rest } = s;
    const { [filename]: _, ...restFiles } = files;
    return {
      ...rest,
      files: restFiles,
    };
  },
  [WorkspaceAction.SELECT_FILE]: (s: WorkspaceState, { payload: { filename } }: Action<FilePayload>) => {
    return {
      ...s,
      selectedFile: filename,
    };
  },
  [WorkspaceAction.SNIPPET_LOAD_START]: (_: WorkspaceState, { payload: id }: Action<string>) => {
    return {
      selectedFile: null,
      snippet: {
        id,
        loading: true,
      }
    }
  },
  [WorkspaceAction.SNIPPET_LOAD_FINISH]: (_: WorkspaceState, { payload: {id, error, files}}: Action<SnippetLoadPayload>) => {
    if (error || !files) {
      return {
        selectedFile: null,
        snippet: {
          id,
          loading: false,
          error,
        }
      }
    }

    return {
      snippet: {
        id,
      },
      selectedFile: Object.keys(files)[0],
      files,
    }
  },
  [WorkspaceAction.SNIPPET_LOAD_SKIP]: (s: WorkspaceState, _: Action<void>) => ({
   ...s,
   snippet: null,
  }),
}, initialWorkspaceState);
