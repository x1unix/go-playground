export type WriteListener = (data: ArrayBufferLike) => void

export interface Stdio {
  stdout: WriteListener
  stderr: WriteListener
}

export interface StartupParams {
  env?: Record<string, string>
  args?: string[]
}

export interface ExecParams {
  /**
   * WebAssembly program binary
   */
  image: ArrayBuffer

  /**
   * Program execution params.
   */
  params?: StartupParams
}

export interface GoExecutor {
  /**
   * Attaches event listeners and initializes an executor.
   * @param stdio
   */
  initialize: (stdio: Stdio) => void

  /**
   * Starts Go WebAssembly program and returns exit code.
   */
  run: (params: ExecParams) => Promise<number>
}
