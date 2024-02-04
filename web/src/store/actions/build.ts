import { ActionType } from './actions'

import { type EvalEvent } from '~/services/api'

export const newProgramWriteAction = (event: EvalEvent) => ({
  type: ActionType.EVAL_EVENT,
  payload: event,
})

export const newProgramStartAction = () => ({
  type: ActionType.EVAL_START,
  payload: null,
})

export const newProgramFinishAction = () => ({
  type: ActionType.EVAL_FINISH,
  payload: null,
})
