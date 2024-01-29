import type { WorkspaceState } from './types';

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
   * Indicates that snippet loading is skipped.
   */
  SNIPPET_LOAD_SKIP = 'WORKSPACE_SNIPPET_LOAD_SKIP',

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
   * Indicates that current file tab changed.
   */
  SELECT_FILE = 'WORKSPACE_SELECT_FILE',
}

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
