import type { WorkspaceState } from './state'

export enum WorkspaceAction {
  /**
   * Indicates that snippet loading started.
   */
  SNIPPET_LOAD_START = 'WORKSPACE_SNIPPET_LOAD_START',

  /**
   * Indicates that snippet loading is finished (success of error).
   */
  SNIPPET_LOAD_FINISH = 'WORKSPACE_SNIPPET_LOAD_FINISH',

  /**
   * Implicitly set workspace state.
   */
  WORKSPACE_IMPORT = 'WORKSPACE_IMPORT',

  /**
   * Indicates that a new file was added.
   */
  ADD_FILE = 'WORKSPACE_ADD_FILE',

  /**
   * Indicates that file was removed.
   */
  REMOVE_FILE = 'WORKSPACE_REMOVE_FILE',

  /**
   * Indicates that file content was updated.
   */
  UPDATE_FILE = 'WORKSPACE_UPDATE_FILE',

  /**
   * Bulk files update.
   */
  UPDATE_FILES = 'WORKSPACE_UPDATE_FILES',

  /**
   * Indicates that current file tab changed.
   */
  SELECT_FILE = 'WORKSPACE_SELECT_FILE',

  /**
   * Indicates that workspace name was changed.
   */
  UPDATE_NAME = 'WORKSPACE_UPDATE_NAME',

  /**
   * Save workspace to storage.
   */
  SAVE = 'WORKSPACE_SAVE',

  /**
   * Load workspace from storage.
   */
  LOAD = 'WORKSPACE_LOAD',
}

export type BulkFileUpdatePayload = Record<string, string>

export interface FilePayload {
  /**
   * Related file name.
   */
  filename: string
}

export interface FileUpdatePayload extends FilePayload {
  /**
   * File content.
   */
  content: string
}

export interface SnippetLoadPayload {
  id: string
  error?: string | null
  files?: WorkspaceState['files']
}

// NOTE: not sure if this is the correct location for this definition
export const updateWorkspaceNameAction = (name: string) => ({
  type: WorkspaceAction.UPDATE_NAME,
  payload: name,
});

