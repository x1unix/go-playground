import config from '~/services/config'
import { type WorkspaceState, defaultFiles, defaultFileName, newGenerationKey } from './state'

const CONFIG_KEY = 'workspace.state'

const defaultWorkspace: WorkspaceState = {
  generation: -1,
  selectedFile: defaultFileName,
  files: defaultFiles,
}

const sanitizeState = (state: WorkspaceState) => {
  // Skip current snippet URL.
  const { selectedFile, files } = state

  if (!files) {
    // Save defaults if ws is empty.
    return defaultWorkspace
  }

  return {
    generation: newGenerationKey(),
    selectedFile,
    files,
  }
}

export const truncateWorkspaceState = () => config.delete(CONFIG_KEY)

export const saveWorkspaceState = (state: WorkspaceState) => {
  const sanitized = sanitizeState(state)
  if (!sanitized.files || Object.keys(sanitized.files).length === 0) {
    // Truncate saved state if workspace is empty.
    config.delete(CONFIG_KEY)
    return
  }

  config.setObject(CONFIG_KEY, sanitized)
}

export const loadWorkspaceState = (): WorkspaceState => sanitizeState(config.getObject(CONFIG_KEY, defaultWorkspace))
