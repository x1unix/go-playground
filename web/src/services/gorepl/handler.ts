import {Worker} from "~/lib/gowasm/bindings/worker";

export interface GoReplWorker extends Worker {
  runProgram(strSize: number, data: Uint8Array)
  terminateProgram()
}


