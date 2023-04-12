import {
  GoWebAssemblyInstance,
  GoWrapper,
  instantiateStreaming,
  wrapGlobal,
} from "~/lib/go";
import {
  PackageCacheDB,
  PackageFileStore,
  PackageIndex
} from "~/services/gorepl/pkgcache";
import {registerExportObject} from "~/lib/gowasm";
import SyscallHelper from "~/lib/gowasm/syscall";
import {LoggerBinding} from "~/lib/gowasm/bindings/wlog";
import {ConsoleBinding, ConsoleStreamType} from "~/lib/gowasm/bindings/stdio";
import {BrowserFSBinding} from "~/lib/gowasm/bindings/browserfs";
import {PackageDBBinding} from "~/lib/gowasm/bindings/packagedb";
import {WorkerBinding} from "~/lib/gowasm/bindings/worker";
import {
  GoReplWorker,
} from "~/services/gorepl/handler";
import {UIHostBinding} from "~/services/gorepl/binding";

declare const self: DedicatedWorkerGlobalScope;
export default {} as typeof Worker & { new (): Worker };

const DEBUG = false;
// const DEBUG = true;

const startWorker = () => new Promise<GoReplWorker>((res, rej) => {
  const go = new GoWrapper(new self.Go(), {
    debug: DEBUG,
    globalValue: wrapGlobal({}, self)
  });

  const helper = new SyscallHelper(go, false);
  const pkgDb = new PackageCacheDB();
  const pkgIndex = new PackageIndex(pkgDb)
  const fs = new PackageFileStore(pkgDb);

  go.setEnv('GOPATH', '/go');
  go.setEnv('WASM_DEBUG', '0');

  // Core imports
  registerExportObject(go, helper);
  registerExportObject(go, new LoggerBinding());
  registerExportObject(go, new BrowserFSBinding(helper, fs));
  registerExportObject(go, new PackageDBBinding(helper, pkgIndex));
  registerExportObject(go, new ConsoleBinding({
    write(fd: ConsoleStreamType, msg: string) {
      if (fd === ConsoleStreamType.Stderr) {
        console.error(msg);
        return
      }

      console.log(msg);
    }
  }));

  // Worker-specific imports
  registerExportObject(go, new WorkerBinding<GoReplWorker>(go, {
    onWorkerRegister: (worker) => {
      res(worker);
    }
  }));
  registerExportObject(go, new UIHostBinding({
    onPackageManagerEvent: e => {
      console.log('onPackageManagerEvent', e)
    },
    onProgramEvalStateChange: (state, msg) => {
      console.log('onProgramEvalStateChange', { state, msg});
    }
  }));

  instantiateStreaming(fetch('/go.wasm'), go.importObject).then(({instance}) => (
    go.run(instance as GoWebAssemblyInstance)
  ))
    .then(() => console.log('worker finished'))
    .catch(err => rej(err));
})

async function run() {
  self.importScripts('/wasm_exec.js');
  const worker = await startWorker();

  console.log('Worker loaded:', worker);
  setTimeout(() => {
    console.log('Stopping worker');
    worker.exit();
  }, 2000);
}

run().then(() => console.log('Worker started...')).catch(err => console.error('RUN ERR-', err))
