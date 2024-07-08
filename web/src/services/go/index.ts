import '~/lib/go/wasm_exec.js'
import { FileSystemWrapper } from './fs'
import ProcessStub from './process'
import { StdioWrapper, type ConsoleLogger } from './stdio'
import { type GoWebAssemblyInstance, GoWrapper, wrapGlobal } from '~/lib/go'

// TODO: Uncomment, when "types.ts" will be fixed
// import { Go, Global } from './go';

let instance: GoWrapper
let wrapper: StdioWrapper

interface LifecycleListener {
  onExit: (code: number) => void
}

/**
 * Runs Go WebAssembly binary.
 *
 * @param m WebAssembly instance.
 * @param args Custom command line arguments.
 */
export const goRun = async (m: WebAssembly.WebAssemblyInstantiatedSource, args?: string[] | null) => {
  if (!instance) {
    throw new Error('Go runner instance is not initialized')
  }

  wrapper.reset()
  await instance.run(m.instance as GoWebAssemblyInstance, args)
}

/**
 * Runs Go unit test WebAssembly binary with testing arguments (`-test.v`).
 *
 * @param m WebAssembly instance.
 * @param args Additional command line arguments.
 */
export const goTestRun = async (m: WebAssembly.WebAssemblyInstantiatedSource, args?: string[] | null) => {
  let testArgs = ['-test.v']
  if (args?.length) {
    testArgs = testArgs.concat(args)
  }

  return await goRun(m, testArgs)
}

export const getImportObject = () => instance.importObject

export const bootstrapGo = (logger: ConsoleLogger, listener: LifecycleListener) => {
  if (instance) {
    // Skip double initialization
    return
  }

  // Wrap Go's calls to os.Stdout and os.Stderr
  wrapper = new StdioWrapper(logger)

  // global overlay
  const mocks = {
    mocked: true,
    fs: new FileSystemWrapper(wrapper.stdoutPipe, wrapper.stderrPipe),
    process: ProcessStub,
  }

  // Wrap global Window and Go object to intercept console calls.
  instance = new GoWrapper(new globalThis.Go(), {
    globalValue: wrapGlobal(mocks, globalThis),
  })

  instance.onExit = (code: number) => {
    console.log('Go: WebAssembly program finished with code:', code)
    listener.onExit(code)
  }
}
