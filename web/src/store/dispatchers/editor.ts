import type { Position } from '../state'
import type { Dispatcher } from './utils'
import { newCursorPositionAction } from '../actions'

export const newCursorPositionChangeDispatcher = (position: Position): Dispatcher => {
  return (dispatch) => {
    dispatch(newCursorPositionAction(position))
  }
}
