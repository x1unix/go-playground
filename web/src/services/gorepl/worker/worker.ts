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
import {PackageManagerEvent, ProgramStateChangeEvent} from "./types";
import {
  PackageCacheDB,
  PackageFileStore,
  PackageIndex
} from "../pkgcache";
import {
  StdoutWriteEvent,
  WorkerEvent,
  WorkerConfig,
  GoWorkerExitEvent,
  defaultWorkerConfig
} from "./interface";
import {UIHostBinding} from "./binding";

/**
 * Go WASM executable URL
 */
const GO_WASM_URL = process.env.REACT_APP_GO_WASM_URL ?? '/go.wasm';

export interface GoReplWorker extends Worker {
  runProgram(strSize: number, data: Uint8Array)
  updateGoProxyAddress(newAddress: string)
  terminateProgram()
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
    let started = false;

    const timeoutId = setTimeout(() => {
      if (started) {
        return;
      }
      rej(new Error('Go WebAssembly worker start timeout exceeded'));
    }, cfg.startTimeout);

    // Wrap Go from wasm_exec.js with overlay.
    const go = new GoWrapper(new globalScope.Go(), {
      debug: cfg.debugRuntime,
      globalValue: wrapGlobal({}, globalScope)
    });

    const helper = new SyscallHelper(go, false);
    const pkgDb = new PackageCacheDB();
    const pkgIndex = new PackageIndex(pkgDb)
    const fs = new PackageFileStore(pkgDb);

    go.setEnv('GOPATH', '/go');
    go.setEnv('WASM_DEBUG', cfg.debugWasm ? '0' : '1');
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
        started = true;
        clearTimeout(timeoutId);
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

    instantiateStreaming(fetch(GO_WASM_URL), go.importObject)
      .then(({instance}) => (
        go.run(instance as GoWebAssemblyInstance)
      ))
      .then(() => {
        rpcClient.publish<GoWorkerExitEvent>(WorkerEvent.GoWorkerExit, {});
      })
      .catch(err => rej(err))
      .finally(() => clearTimeout(timeoutId));
  }
);
