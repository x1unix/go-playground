import {Client} from "~/lib/wrpc";
import {EvalEventKind} from "../api";
import {ConsoleStreamType} from "~/lib/gowasm/bindings/stdio";
import {
  ActionType,
  newErrorAction,
  newProgramWriteAction,
} from "~/store/actions";
import { DispatchFn, StateProvider} from "~/store/helpers";

import {
  newAddNotificationAction,
  newRemoveNotificationAction,
  NotificationType
} from "~/store/notifications";
import {
  EvalState,
  PackageManagerEvent,
  PMEventType,
  ProgramStateChangeEvent,
} from "./worker/types";
import {
  WorkerInterface,
  WorkerEvent,
  StdoutWriteEvent, defaultWorkerConfig, WorkerConfig,
} from "./worker/interface";

const PKG_MGR_NOTIFICATION_ID = 'packageManager'
const WORKER_NOTIFICATION_ID = 'goWorker';

/**
 * Worker client singleton
 */
let clientInstance: WorkerClient;

/**
 * RPC client for a Go web worker
 */
class WorkerClient implements WorkerInterface {
  constructor(private client: Client) {}

  runProgram(code: string) {
    return this.client.call('runProgram', code);
  }

  terminateProgram() {
    return this.client.call('terminateProgram', null);
  }

  updateGoProxyAddress(newAddress: string) {
    return this.client.call('updateGoProxyAddress', newAddress);
  }
}

/**
 * Bootstraps and returns Go worker client.
 * Returns existing client instance if client was previously instantiated.
 *
 * @see /web/src/workers/go.worker.ts
 *
 * @param dispatcher State dispatcher.
 * @param stateProvider State getter.
 */
export const getWorkerInstance = async (dispatcher: DispatchFn, stateProvider: StateProvider): Promise<WorkerClient> => {
  if (clientInstance) {
    return clientInstance;
  }

  dispatcher(newAddNotificationAction({
    id: WORKER_NOTIFICATION_ID,
    type: NotificationType.Info,
    title: 'Starting Go worker',
    canDismiss: false,
    progress: {
      indeterminate: true
    }
  }));

  const worker = new Worker(new URL('../../workers/go.worker.ts', import.meta.url));
  const client = new Client(worker);

  const state = stateProvider();

  try {
    await client.ping();
    await client.call<WorkerConfig>('init', {
      ...defaultWorkerConfig,
      env: {
        GOPROXY: state.settings.goProxyUrl
      }
    });
  } catch (err) {
    dispatcher(newRemoveNotificationAction(WORKER_NOTIFICATION_ID));
    worker.terminate();
    client.dispose();
    throw err;
  }

  dispatcher(newRemoveNotificationAction(WORKER_NOTIFICATION_ID));
  clientInstance = new WorkerClient(client);

  // Populate program execution events to Redux
  client.subscribe<PackageManagerEvent>(WorkerEvent.PackageManagerEvent, event => {
    handlePackageManagerEvent(dispatcher, event);
  });
  client.subscribe<ProgramStateChangeEvent>(WorkerEvent.ProgramEvalStateChange, event => {
    handleProgramStateEvent(dispatcher, event);
  });
  client.subscribe<StdoutWriteEvent>(WorkerEvent.StdoutWrite, event => {
    handleStdoutWrite(dispatcher, event);
  });

  return clientInstance;
}

const handleStdoutWrite = (dispatcher: DispatchFn, {msgType, message}: StdoutWriteEvent) => {
  dispatcher(newProgramWriteAction({
    Kind: msgType === ConsoleStreamType.Stderr ? EvalEventKind.Stderr : EvalEventKind.Stdout,
    Message: message,
    Delay: 0,
  }));
}

const handleProgramStateEvent = (dispatcher: DispatchFn, {state, message}: ProgramStateChangeEvent) => {
  switch (state) {
    case EvalState.Finish:
      dispatcher({type: ActionType.EVAL_FINISH});
      return;
    case EvalState.Begin:
      // Keep UI is busy state until program or package manager is running
      dispatcher({type: ActionType.LOADING});
      return;
    case EvalState.Error:
      dispatcher(newErrorAction(message ?? 'Failed to start program'));
      return;
    case EvalState.Panic:
      dispatcher(newProgramWriteAction({
        Kind: EvalEventKind.Stderr,
        Message: message!,
        Delay: 0,
      }));
      return;
    default:
      return;
  }
}

const handlePackageManagerEvent = (dispatcher: DispatchFn, event: PackageManagerEvent) => {
  const {success, context, totalItems} = event;
  switch (event.eventType) {
    case PMEventType.DependencyCheckFinish:
      if (success) {
        dispatcher(newRemoveNotificationAction(PKG_MGR_NOTIFICATION_ID));
        return;
      }

      dispatcher(newAddNotificationAction({
        id: PKG_MGR_NOTIFICATION_ID,
        type: NotificationType.Error,
        title: 'Package installation failed',
        description: context,
        canDismiss: true,
      }));
      return;
    case PMEventType.DependencyResolveStart:
      dispatcher(newAddNotificationAction({
        id: PKG_MGR_NOTIFICATION_ID,
        type: NotificationType.Info,
        title: 'Installing dependencies',
        description: `Searching ${totalItems} packages...`,
        canDismiss: false,
        progress: {
          indeterminate: true,
        }
      }));
      return;
    case PMEventType.PackageSearchStart:
      dispatcher(newAddNotificationAction({
        id: PKG_MGR_NOTIFICATION_ID,
        type: NotificationType.Info,
        title: 'Installing dependencies',
        description: `Downloading ${context}`,
        canDismiss: false,
        progress: {
          indeterminate: true,
        }
      }));
      return;
    case PMEventType.PackageDownload:
      dispatcher(newAddNotificationAction({
        id: PKG_MGR_NOTIFICATION_ID,
        type: NotificationType.Info,
        title: 'Installing dependencies',
        description: `Downloading ${context}`,
        canDismiss: false,
        progress: {
          total: event.totalItems,
          current: event.processedItems,
        }
      }));
      return;
    case PMEventType.PackageExtract:
      dispatcher(newAddNotificationAction({
        id: PKG_MGR_NOTIFICATION_ID,
        type: NotificationType.Info,
        title: 'Installing dependencies',
        description: `Extracting ${context}`,
        canDismiss: false,
        progress: {
          total: event.totalItems,
          current: event.processedItems,
        }
      }));
      return;
    default:
      return;
  }
}
