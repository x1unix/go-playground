import {ConsoleStreamType} from "~/lib/gowasm/bindings/stdio";

/**
 * Default Worker config
 */
export const defaultWorkerConfig: WorkerConfig = {
  startTimeout: 5000
};

/**
 * WebWorker RPC interface that should be implemented by client and server.
 */
export interface WorkerInterface {
  runProgram(code: string): Promise<void>
  terminateProgram(): Promise<void>
  updateGoProxyAddress(newAddress: string): Promise<void>
}

/**
 * Go worker config
 */
export interface WorkerConfig {
  /**
   * Enables WebAssembly worker debug output
   */
  debugWasm?: boolean

  /**
   * Enables gowasm bridge debug output
   */
  debugRuntime?: boolean

  /**
   * WebAssembly start timeout
   */
  startTimeout?: number

  /**
   * Custom environment variables
   */
  env?: {[k: string]: string}
}


/**
 * WebWorker events list
 */
export enum WorkerEvent {
  /**
   * Event fired during dependency lookup or download progress
   */
  PackageManagerEvent = 'packageManagerEvent',

  /**
   * Event fired during Go program execution lifecycle
   */
  ProgramEvalStateChange = 'programEvalStateChange',

  /**
   * Event fired when Go program output to stdout
   */
  StdoutWrite = 'stdoutWrite',

  /**
   * Event fired when Go WebAssembly worker was shut down
   */
  GoWorkerExit = 'goWorkerExit'
}

/**
 * Go program stdout write event fired by Worker.
 */
export interface StdoutWriteEvent {
  msgType: ConsoleStreamType
  message: string
}

export interface GoWorkerExitEvent {
  error?: string
}
