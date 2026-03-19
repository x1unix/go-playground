import type { editor } from 'monaco-editor'
import type { Position } from '../state'

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

export const newCursorPositionAction = (position: Position) => ({
  type: ActionType.CURSOR_POSITION_CHANGE,
  payload: {
    position,
  },
})

export interface CursorPositionChangePayload {
  position: Position
}
