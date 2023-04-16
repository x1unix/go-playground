import {Client} from "~/lib/wrpc";
import {stringEncoder} from "~/lib/go";
import {
  defaultWorkerConfig,
  GoReplWorker,
  startGoWorker, WorkerConfig,
} from "~/services/gorepl/worker";

declare const self: DedicatedWorkerGlobalScope;
export default {} as typeof Worker & { new (): Worker };

self.importScripts('/wasm_exec.js');

let worker: GoReplWorker|null = null;
const rpcClient = new Client(globalThis, {
  init: async (cfg: WorkerConfig = defaultWorkerConfig) => {
    worker = await startGoWorker(self, rpcClient, cfg);
  },
  runProgram: (code: string) => {
    if (!worker) {
      throw new Error('Go WebAssembly worker is not ready yet');
    }

    const data = stringEncoder.encode(code);
    worker.runProgram(data.length, data);
  },
  terminateProgram: async () => {
    if (!worker) {
      return;
    }

    worker.exit();
  },
  updateGoProxyAddress: (newAddress: string) => {
    if (!worker) {
      return;
    }

    try {
      new URL(newAddress);
    } catch (ex) {
      throw new Error(`invalid Go module proxy URL "${newAddress}": ${ex}`);
    }

    worker.updateGoProxyAddress(newAddress);
  }
});
