import { ActionType} from "./actions";

export interface FileImportArgs {
  fileName: string
  contents: string
}

export const newImportFileAction = (fileName: string, contents: string) =>
({
  type: ActionType.IMPORT_FILE,
  payload: { fileName, contents },
});

export const newFileChangeAction = (contents: string) =>
({
  type: ActionType.FILE_CHANGE,
  payload: contents,
});
