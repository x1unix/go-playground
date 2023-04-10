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

declare const self: DedicatedWorkerGlobalScope;
export default {} as typeof Worker & { new (): Worker };

const DEBUG = false;
// const DEBUG = true;

async function run() {
  self.importScripts('/wasm_exec.js')
  const go = new GoWrapper(new self.Go(), {
    debug: DEBUG,
    globalValue: wrapGlobal({}, self)
  });

  go.setEnv('GOPATH', '/go');
  go.setEnv('WASM_DEBUG', '1');

  const helper = new SyscallHelper(go, false);

  const pkgDb = new PackageCacheDB();
  const pkgIndex = new PackageIndex(pkgDb)
  const fs = new PackageFileStore(pkgDb);

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

  const {instance} = await instantiateStreaming(fetch('/go.wasm'), go.importObject);
  go.run(instance as GoWebAssemblyInstance)
    .then(() => console.log('execution finished'))
    .catch(console.error);
}

run().then(() => console.log('Worker started...')).catch(err => console.error('RUN ERR-', err))
