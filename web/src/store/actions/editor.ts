import type { editor } from 'monaco-editor'

import { ActionType } from './actions'

export const newMarkerAction = (fileName: string, markers?: editor.IMarkerData[]) => ({
  type: ActionType.MARKER_CHANGE,
  payload: {
    fileName,
    markers,
  },
})

export interface MarkerChangePayload {
  fileName: string
  markers?: editor.IMarkerData[] | null
}
