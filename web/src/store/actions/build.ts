import { ActionType } from "./actions";

import { EvalEvent } from '~/services/api';

export const newFormatCodeAction = (newText?: string) => (
  {
    type: ActionType.FORMAT_CODE,
    payload: newText,
  }
);

export const newProgramWriteAction = (event: EvalEvent) => (
  {
    type: ActionType.EVAL_EVENT,
    payload: event
  }
);

export const newProgramStartAction = () => (
  {
    type: ActionType.EVAL_START,
    payload: null
  }
);

export const newProgramFinishAction = () => (
  {
    type: ActionType.EVAL_FINISH,
    payload: null
  }
);
