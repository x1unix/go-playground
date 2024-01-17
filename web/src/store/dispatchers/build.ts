import {TargetType} from '~/services/config';
import {getWorkerInstance} from "~/services/gorepl";
import {getImportObject, goRun} from '~/services/go';
import {setTimeoutNanos, SECOND} from "~/utils/duration";
import { instantiateStreaming } from "~/lib/go";
import client, {
  EvalEvent,
  EvalEventKind,
} from "~/services/api";

import {DispatchFn, StateProvider} from "../helpers";
import {
  newAddNotificationAction,
  newRemoveNotificationAction,
  NotificationType
} from "../notifications";
import {
  newErrorAction,
  newFormatCodeAction,
  newLoadingAction,
  newProgramFinishAction,
  newProgramStartAction,
  newProgramWriteAction,
} from "../actions";

import {Dispatcher} from "./utils";
import {wrapResponseWithProgress} from "~/utils/http";

const WASM_APP_DOWNLOAD_NOTIFICATION = 'WASM_APP_DOWNLOAD_NOTIFICATION';
const WASM_APP_EXIT_ERROR = 'WASM_APP_EXIT_ERROR';

/**
 * Go program execution timeout in nanoseconds
 */
const runTimeoutNs = 5 * SECOND;

const lastElem = <T>(items: T[]): T|undefined => (
  items?.slice(-1)?.[0]
);

const hasProgramTimeoutError = (events: EvalEvent[]) => {
  if (!events.length) {
    return false;
  }

  const { Message, Kind } = events[0];
  if (Kind === 'stderr' && Message.trim() === 'timeout running program') {
    const lastEvent = lastElem(events);
    return lastEvent!.Delay >= runTimeoutNs;
  }

  return false;
}

const dispatchEvalEvents = (dispatch: DispatchFn, events: EvalEvent[]) => {
  // TODO: support cancellation
  dispatch(newProgramStartAction());

  if (!events?.length) {
    dispatch(newProgramFinishAction());
    return;
  }

  // Each eval event contains time since previous event.
  // Convert relative delay into absolute delay since program start.
  let eventsWithDelay = events
    .reduce((accum: EvalEvent[], {Delay: delay, ...item}) => (
      [
        ...accum,
        {
          ...item,
          Delay: (lastElem(accum)?.Delay ?? 0) + delay,
        }
      ]
    ), []);

  // Sometimes Go playground fails to detect execution timeout error and still sends all events.
  // This dirty hack attempts to normalize this case.
  if (hasProgramTimeoutError(eventsWithDelay)) {
    eventsWithDelay = eventsWithDelay
      .slice(1)
      .filter(({Delay}) => Delay <= runTimeoutNs)
      .concat({
        Kind: EvalEventKind.Stderr,
        Message: `Go program execution timeout exceeded (max: ${runTimeoutNs / SECOND}s)`,
        Delay: runTimeoutNs,
      });
  }

  // Try to guess program end time by checking last message delay.
  //
  // This won't work if "time.Sleep()" occurs after final message but the same
  // approach used in official playground, so should be enough for us.
  let programEndTime = lastElem(eventsWithDelay)?.Delay ?? 0;

  eventsWithDelay.forEach(event => {
    setTimeoutNanos(() => {
      dispatch(newProgramWriteAction(event))
    }, event.Delay);
  });

  setTimeoutNanos(() => {
    dispatch(newProgramFinishAction());
  }, programEndTime);
}

const fetchWasmWithProgress = async (dispatch: DispatchFn, fileName: string) => {
  try {
    dispatch(newAddNotificationAction({
      id: WASM_APP_DOWNLOAD_NOTIFICATION,
      type: NotificationType.Info,
      title: 'Downloading compiled program',
      canDismiss: false,
      progress: {
        indeterminate: true
      }
    }));

    const rsp = await client.getArtifact(fileName);
    const rspWithProgress = wrapResponseWithProgress(rsp, ({totalBytes, currentBytes}) => {
      dispatch(newAddNotificationAction({
        id: WASM_APP_DOWNLOAD_NOTIFICATION,
        type: NotificationType.Info,
        title: 'Downloading compiled application',
        canDismiss: false,
        progress: {
          total: totalBytes,
          current: currentBytes
        }
      }));
    });

    return instantiateStreaming(rspWithProgress, getImportObject());
  } catch (err) {
    dispatch(newRemoveNotificationAction(WASM_APP_DOWNLOAD_NOTIFICATION));
    throw err;
  }
}

export const runFileDispatcher: Dispatcher =
  async (dispatch: DispatchFn, getState: StateProvider) => {
    dispatch(newLoadingAction());
    dispatch(newRemoveNotificationAction(WASM_APP_EXIT_ERROR));

    try {
      const { settings, editor, runTarget: {target, backend} } = getState();
      switch (target) {
        case TargetType.Server:
          const res = await client.evaluateCode(editor.code, settings.autoFormat, backend);
          if (res.formatted?.length) {
            dispatch(newFormatCodeAction(res.formatted));
          }
          dispatchEvalEvents(dispatch, res.events);
          break;

        case TargetType.WebAssembly:
          let resp = await client.build(editor.code, settings.autoFormat);
          if (resp.formatted?.length) {
            dispatch(newFormatCodeAction(resp.formatted));
          }

          const instance = await fetchWasmWithProgress(dispatch, resp.fileName);
          dispatch(newRemoveNotificationAction(WASM_APP_DOWNLOAD_NOTIFICATION));
          dispatch(newProgramStartAction());

          goRun(instance)
            .then(result => console.log('exit code: %d', result))
            .catch(err => {
              dispatch(newAddNotificationAction({
                id: WASM_APP_EXIT_ERROR,
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

export const createGoConsoleAdapter = (dispatch: DispatchFn) => (
  {
    log: (eventType: EvalEventKind, message: string) => {
      dispatch(newProgramWriteAction({
        Kind: eventType,
        Message: message,
        Delay: 0,
      }));
    }
  }
);

export const createGoLifecycleAdapter = (dispatch: DispatchFn) => (
  {
    onExit: (code: number) => {
      dispatch(newProgramFinishAction());

      if (isNaN(code) || code === 0) {
        return;
      }

      dispatch(newAddNotificationAction({
        id: WASM_APP_EXIT_ERROR,
        type: NotificationType.Warning,
        title: 'Go program finished',
        description: `Go program exited with non zero code: ${code}`,
        canDismiss: true,
      }));
    }
  }
);
