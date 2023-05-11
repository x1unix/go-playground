import {
  GoWebAssemblyInstance,
  GoWrapper,
  instantiateStreaming,
  wrapGlobal,
} from "~/lib/go";
import {Client} from "~/lib/wrpc";
import {registerExportObject} from "~/lib/gowasm";
import SyscallHelper from "~/lib/gowasm/syscall";
import {LoggerBinding} from "~/lib/gowasm/bindings/wlog";
import {ConsoleBinding, ConsoleStreamType} from "~/lib/gowasm/bindings/stdio";
import {BrowserFSBinding} from "~/lib/gowasm/bindings/browserfs";
import {PackageDBBinding} from "~/lib/gowasm/bindings/packagedb";
import {Worker, WorkerBinding} from "~/lib/gowasm/bindings/worker";

import { wrapResponseWithProgress } from "~/utils/http";
import {FileSystemWrapper} from "~/services/go/fs";
import ProcessStub from "~/services/go/process";

import {PackageManagerEvent, ProgramStateChangeEvent} from "./types";
import {PackageCacheDB, PackageFileStore, PackageIndex} from "../pkgcache";
import {
  defaultWorkerConfig,
  GoWorkerBootEvent,
  GoWorkerBootEventType,
  GoWorkerExitEvent,
  StdoutWriteEvent,
  WorkerConfig,
  WorkerEvent
} from "./interface";
import {UIHostBinding} from "./binding";
import {StdioWrapper} from "./console";

/**
 * Go WASM executable URL
 */
const GO_WASM_URL = process.env.REACT_APP_GO_WASM_URL ?? '/go-repl.wasm';

export interface GoReplWorker extends Worker {
  runProgram(strSize: number, data: Uint8Array)
  updateGoProxyAddress(newAddress: string)
  terminateProgram()
}

class BootTimeoutGuard {
  private timeout?: NodeJS.Timeout;
  private started = false;

  startBootTimeout(rejector: Function, ms?: number) {
    if (!ms) {
      return;
    }

    this.timeout = setTimeout(() => {
      if (this.started) {
        return;
      }

      rejector(new Error('Go WebAssembly worker start timeout exceeded'));
    });
  }

  cancel(isStarted=true) {
    this.started = isStarted;
    clearTimeout(this.timeout!);
  }
}

/**
 * Starts a new Go WebAssembly interpreter worker and attaches RPC client.
 *
 * @see /cmd/gorepl/main.go
 * @param globalScope Global scope (globalThis, window, etc).
 * @param rpcClient WRPC client instance.
 * @param cfg Custom startup config
 */
export const startGoWorker = (globalScope: any, rpcClient: Client, cfg: WorkerConfig = defaultWorkerConfig) => new Promise<GoReplWorker>(
  (res, rej) => {
    const timeout = new BootTimeoutGuard();

    const ioWrapper = new StdioWrapper(rpcClient);
    const globalMocks = {
      fs: new FileSystemWrapper(ioWrapper.stdoutPipe, ioWrapper.stderrPipe),
      process: ProcessStub,
    }

    // Wrap Go from wasm_exec.js with overlay.
    const go = new GoWrapper(new globalScope.Go(), {
      debug: cfg.debugRuntime,
      globalValue: wrapGlobal(globalMocks, globalScope)
    });

    const helper = new SyscallHelper(go, false);
    const pkgDb = new PackageCacheDB();
    const pkgIndex = new PackageIndex(pkgDb)
    const fs = new PackageFileStore(pkgDb);

    go.setEnv('GOPATH', '/go');
    go.setEnv('WASM_DEBUG', cfg.debugWasm ? '1' : '0');
    if (cfg.env) {
      Object.entries(cfg.env)
        .forEach(([k, v]) => go.setEnv(k, v));
    }

    // Core imports (logger, fs, package manager)
    registerExportObject(go, helper);
    registerExportObject(go, new LoggerBinding());
    registerExportObject(go, new BrowserFSBinding(helper, fs));
    registerExportObject(go, new PackageDBBinding(helper, pkgIndex));

    // Attach stdout to client
    registerExportObject(go, new ConsoleBinding({
      write(fd: ConsoleStreamType, msg: string) {
        rpcClient.publish<StdoutWriteEvent>(WorkerEvent.StdoutWrite, {
          msgType: fd,
          message: msg
        });
      }
    }));

    // Intercept Go runtime start
    registerExportObject(go, new WorkerBinding<GoReplWorker>(go, {
      onWorkerRegister: (worker) => {
        timeout.cancel(true);
        rpcClient.publish<GoWorkerBootEvent>(WorkerEvent.GoWorkerBoot, {
          eventType: GoWorkerBootEventType.Complete,
        });
        res(worker);
      }
    }));

    // Register Go interpreter event handlers
    registerExportObject(go, new UIHostBinding({
      onPackageManagerEvent: e => {
        rpcClient.publish<PackageManagerEvent>(WorkerEvent.PackageManagerEvent, e);
      },
      onProgramEvalStateChange: e => {
        rpcClient.publish<ProgramStateChangeEvent>(WorkerEvent.ProgramEvalStateChange, e);
      }
    }));

    // Capture worker crash event
    go.onExit = (code: number) => {
      rpcClient.publish<GoWorkerBootEvent>(WorkerEvent.GoWorkerBoot, {
        eventType: GoWorkerBootEventType.Crash,
        code: code,
      });
    };

    instantiateStreaming(fetchWithProgress(rpcClient, GO_WASM_URL), go.importObject)
      .then(({instance}) => {
        rpcClient.publish<GoWorkerBootEvent>(WorkerEvent.GoWorkerBoot, {
          eventType: GoWorkerBootEventType.Starting,
        });
        timeout.startBootTimeout(rej, cfg.startTimeout);
        return go.run(instance as GoWebAssemblyInstance);
      })
      .then(() => {
        rpcClient.publish<GoWorkerExitEvent>(WorkerEvent.GoWorkerExit, {});
      })
      .catch(err => {
        timeout.cancel();
        rej(err);
      });
  }
);

/**
 * Fetches WebAssembly binary with progress reported to the event queue.
 *
 * @param rspClient Worker RPC client
 * @param req Fetch request args
 */
const fetchWithProgress = async (rspClient: Client, req: RequestInfo): Promise<Response> => {
  const rsp = await fetch(req);
  if (rsp.status !== 200) {
    throw new Error(`Cannot fetch WebAssembly worker: GET ${rsp.url} - ${rsp.status} ${rsp.statusText}`);
  }

  return wrapResponseWithProgress(rsp, (progress) => {
    rspClient.publish<GoWorkerBootEvent>(WorkerEvent.GoWorkerBoot, {
      eventType: GoWorkerBootEventType.Downloading,
      progress
    });
  });
}
