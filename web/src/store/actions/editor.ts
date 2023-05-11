import {editor} from "monaco-editor";

import { ActionType} from "./actions";

export const newMarkerAction = (markers?: editor.IMarkerData[]) => (
  {
    type: ActionType.MARKER_CHANGE,
    payload: markers,
  }
);
