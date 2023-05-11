import { TargetType } from '~/services/config';
import { getWorkerInstance } from "~/services/gorepl";
import { getImportObject, goRun } from '~/services/go';
import client, {EvalEventKind, instantiateStreaming} from "~/services/api";

import { StateProvider, DispatchFn } from "../helpers";
import { newAddNotificationAction, NotificationType } from "../notifications";
import {
  newBuildResultAction,
  newErrorAction,
  newLoadingAction,
  newProgramFinishAction,
  newProgramStartAction,
  newProgramWriteAction,
} from "../actions";

import { Dispatcher } from "./utils";

export const runFileDispatcher: Dispatcher =
  async (dispatch: DispatchFn, getState: StateProvider) => {
    dispatch(newLoadingAction());
    try {
      const { settings, editor, runTarget: {target, backend} } = getState();
      switch (target) {
        case TargetType.Server:
          const res = await client.evaluateCode(editor.code, settings.autoFormat, backend);
          console.log(res);
          dispatch(newBuildResultAction(res));
          break;
        case TargetType.WebAssembly:
          let resp = await client.build(editor.code, settings.autoFormat);
          let wasmFile = await client.getArtifact(resp.fileName);
          let instance = await instantiateStreaming(wasmFile, getImportObject());
          dispatch(newProgramStartAction());
          dispatch(newBuildResultAction({ formatted: resp.formatted, events: [] }));
          goRun(instance)
            .then(result => console.log('exit code: %d', result))
            .catch(err => {
              dispatch(newAddNotificationAction({
                id: 'WASM_APP_ERROR',
                type: NotificationType.Error,
                title: 'Failed to run WebAssembly program',
                description: err.toString(),
                canDismiss: true,
              }));
            })
            .finally(() => dispatch(newProgramFinishAction()));
          break;
        case TargetType.Interpreter:
          try {
            const worker = await getWorkerInstance(dispatch, getState);
            await worker.runProgram(editor.code);
          } catch (err: any) {
            dispatch(newErrorAction(err.message ?? err.toString()));
          }

          break;
        default:
          dispatch(newErrorAction(`AppError: Unknown Go runtime type "${target}"`));
      }
    } catch (err: any) {
      dispatch(newErrorAction(err.message));
    }
  };

export const createGoConsoleAdapter = (dispatch: DispatchFn) =>
  ({
    log: (eventType: EvalEventKind, message: string) => {
      console.log('%s:\t%s', eventType, message);
      dispatch(newProgramWriteAction({
        Kind: eventType,
        Message: message,
        Delay: 0,
      }));
    }
  });
