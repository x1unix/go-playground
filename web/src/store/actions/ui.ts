import { ActionType} from "./actions";
import { UIState } from "../state";

export interface LoadingStateChanges {
  loading: boolean
}

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

export const newLoadingAction = (loading = true) => (
  {
    type: ActionType.LOADING_STATE_CHANGE,
    payload: { loading },
  }
);
