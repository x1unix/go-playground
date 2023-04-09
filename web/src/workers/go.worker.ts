import {
  GoWebAssemblyInstance,
  GoWrapper,
  instantiateStreaming,
  wrapGlobal,
} from '~/lib/go';

import {registerExportObject} from '~/lib/gowasm';

import SyscallHelper from '~/lib/gowasm/syscall';
import {LoggerBinding} from "~/lib/gowasm/bindings/wlog";
import {ConsoleBinding, ConsoleStreamType} from "~/lib/gowasm/bindings/stdio";
import BrowserFSBinding from "~/lib/gowasm/bindings/browserfs/binding";

declare const self: DedicatedWorkerGlobalScope;
export default {} as typeof Worker & { new (): Worker };

const DEBUG = false;


async function run() {
  self.importScripts('/wasm_exec.js')
  const go = new GoWrapper(new self.Go(), {
    debug: DEBUG,
    globalValue: wrapGlobal({}, self)
  });

  const helper = new SyscallHelper(go);
  registerExportObject(go, helper);
  registerExportObject(go, new LoggerBinding())
  registerExportObject(go, new BrowserFSBinding(helper, ))
  registerExportObject(go, new ConsoleBinding({
    write(fd: ConsoleStreamType, msg: string) {
      if (fd === ConsoleStreamType.Stderr) {
        console.error(msg);
        return
      }

      console.log(msg);
    }
  }));
  registerExportObject(go, new Test(helper));

  const {instance} = await instantiateStreaming(fetch('/go.wasm'), go.importObject);
  go.run(instance as GoWebAssemblyInstance)
    .then(() => console.log('execution finished'))
    .catch(console.error);
}

run().then(() => console.log('RUN OK')).catch(err => console.error('RUN ERR-', err))
