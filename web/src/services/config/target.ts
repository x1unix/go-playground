import {Backend} from "~/services/api";

/**
 * Go program run configuration
 */
export interface RunTargetConfig {
  /**
   * Execution target
   */
  target: TargetType

  /**
   * Desired backend, used by remote server to select Go version.
   */
  backend?: Backend

  /**
   * Additional options, currently unused
   */
  opts?: any
}

/**
 * Execution target type.
 *
 * Specifies where and how Go program will be executed.
 */
export enum TargetType {
  /**
   * Run program on server
   */
  Server          = 'SERVER',

  /**
   * Build WASM file and execute it in browser
   */
  WebAssembly     = 'WASM',

  /**
   * Execute code inside Go interpreted in browser
   */
  Interpreter     = 'INTERPRETER',
}

export const defaultRunTarget: RunTargetConfig = {
  target: TargetType.Server
}
