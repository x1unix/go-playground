import { ActionType} from "./actions";

import { UIState } from "../state";

export const newUIStateChangeAction = (changes: Partial<UIState>) => (
  {
    type: ActionType.UI_STATE_CHANGE,
    payload: changes
  }
);

export const newErrorAction = (err: string) => (
  {
    type: ActionType.ERROR,
    payload: err,
  }
);

export const newLoadingAction = () => (
  {
    type: ActionType.LOADING,
    payload: null,
  }
);
