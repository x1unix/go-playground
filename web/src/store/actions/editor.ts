import type { Diagnostic } from 'vscode-languageserver-protocol'
import type { Position } from '../state'

import { ActionType } from './actions'

export const newMarkerAction = (fileName: string, markers?: Diagnostic[]) => ({
  type: ActionType.MARKER_CHANGE,
  payload: {
    fileName,
    markers,
  },
})

export interface MarkerChangePayload {
  fileName: string
  markers?: Diagnostic[] | null
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
