import { mapByAction } from '../helpers'
import type { Action } from '../actions'

import { WorkspaceAction, type FileUpdatePayload, type FilePayload, type SnippetLoadPayload } from './actions'
import { initialWorkspaceState, type WorkspaceState } from './state'

export const reducers = mapByAction<WorkspaceState>(
  {
    [WorkspaceAction.ADD_FILE]: (s: WorkspaceState, { payload: items }: Action<FileUpdatePayload[]>) => {
      const { files = {}, ...rest } = s
      const addedFiles = Object.fromEntries(items.map(({ filename, content }) => [filename, content]))
      return {
        ...rest,
        dirty: true,
        selectedFile: items[0].filename,
        files: {
          ...files,
          ...addedFiles,
        },
      }
    },
    [WorkspaceAction.UPDATE_FILE]: (
      s: WorkspaceState,
      { payload: { filename, content } }: Action<FileUpdatePayload>,
    ) => {
      const { files = {}, ...rest } = s
      return {
        ...rest,
        dirty: true,
        files: {
          ...files,
          [filename]: content,
        },
      }
    },
    [WorkspaceAction.UPDATE_FILES]: (s: WorkspaceState, { payload: newFiles }: Action<Record<string, string>>) => {
      const { files: originalFiles, ...rest } = s
      if (!originalFiles) {
        return {
          ...rest,
          files: newFiles,
        }
      }

      // Preserve files order.
      return {
        ...rest,
        files: Object.entries(originalFiles)
          .map(([name, originalContent]) => ({
            [name]: newFiles[name] ?? originalContent,
          }))
          .reduce((obj, item) => ({ ...obj, ...item }), {}),
      } satisfies WorkspaceState
    },
    [WorkspaceAction.REMOVE_FILE]: (s: WorkspaceState, { payload: { filename } }: Action<FilePayload>) => {
      const { files = {}, selectedFile, ...rest } = s

      let newSelectedFile = selectedFile
      if (selectedFile === filename) {
        // Find next tab sibling to set as current.
        // This will work as JS guarantees object keys order.
        const keys = Object.keys(files)
        if (keys.length - 1 <= 0) {
          newSelectedFile = null
        } else {
          const currentIndex = keys.indexOf(filename)
          newSelectedFile = keys[currentIndex === 0 ? 1 : currentIndex - 1]
        }
      }

      const { [filename]: _, ...restFiles } = files
      return {
        ...rest,
        dirty: true,
        selectedFile: newSelectedFile,
        files: restFiles,
      }
    },
    [WorkspaceAction.SELECT_FILE]: (s: WorkspaceState, { payload: { filename } }: Action<FilePayload>) => {
      return {
        ...s,
        selectedFile: filename,
      }
    },
    [WorkspaceAction.SNIPPET_LOAD_START]: (_: WorkspaceState, { payload: id }: Action<string>) => {
      return {
        selectedFile: null,
        snippet: {
          id,
          loading: true,
        },
      }
    },
    [WorkspaceAction.SNIPPET_LOAD_FINISH]: (
      _: WorkspaceState,
      { payload: { id, error, files } }: Action<SnippetLoadPayload>,
    ) => {
      if (error || !files) {
        return {
          selectedFile: null,
          snippet: {
            id,
            loading: false,
            error,
          },
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
    [WorkspaceAction.WORKSPACE_IMPORT]: (_: WorkspaceState, { payload }: Action<WorkspaceState>) => ({
      ...payload,
    }),
  },
  initialWorkspaceState,
)
