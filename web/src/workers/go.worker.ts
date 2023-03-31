import {
  Bool,
  GoStringType,
  GoWebAssemblyInstance,
  GoWrapper,
  Int32,
  Int64,
  Struct,
  Uint32,
  js, UintPtr,
  instantiateStreaming,
  StackReader,
  wrapGlobal,
} from '~/lib/go';

import {
  Package,
  PackageBinding,
  ExportMethod,
  registerExportObject
} from '~/lib/gowasm';

import SyscallHelper from '~/lib/gowasm/syscall';

declare const self: DedicatedWorkerGlobalScope;
export default {} as typeof Worker & { new (): Worker };

const DEBUG = false;

@Package("github.com/x1unix/go-playground/internal/gorepl/tests")
class Test extends PackageBinding {
  constructor(private helper: SyscallHelper) {
    super();
  }

  @ExportMethod("doABarrelRoll")
  doABarrelRoll(sp: number, reader: StackReader) {
    reader.skipHeader();
    const cbid = reader.next<number>(Int32);
    console.log('js: doABarellRoll - ', cbid)
    setTimeout(() => {
      console.log('js: pushing result', cbid);
      this.helper.sendCallbackResult(cbid, 255);
    }, 1000);
  }
}

async function run() {
  self.importScripts('/wasm_exec.js')
  const go = new GoWrapper(new self.Go(), {
    debug: DEBUG,
    globalValue: wrapGlobal({}, self)
  });

  const helper = new SyscallHelper(go);
  registerExportObject(go, helper);
  registerExportObject(go, new Test(helper));

  const {instance} = await instantiateStreaming(fetch('/go.wasm'), go.importObject);
  go.run(instance as GoWebAssemblyInstance)
    .then(() => console.log('execution finished'))
    .catch(console.error);
}

run().then(() => console.log('RUN OK')).catch(err => console.error('RUN ERR-', err))
