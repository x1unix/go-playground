import { ActionType } from "./actions";

import { RunResponse, EvalEvent } from '~/services/api';

export const newBuildResultAction = (resp: RunResponse) => (
  {
    type: ActionType.COMPILE_RESULT,
    payload: resp,
  }
);

export const newProgramWriteAction = (event: EvalEvent) => (
  {
    type: ActionType.EVAL_EVENT,
    payload: event
  }
);
