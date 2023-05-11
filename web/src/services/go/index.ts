import { FileSystemWrapper } from './fs';
import ProcessStub from './process';
import { StdioWrapper, ConsoleLogger } from './stdio';
import {GoWebAssemblyInstance, GoWrapper, wrapGlobal} from "~/lib/go";

// TODO: Uncomment, when "types.ts" will be fixed
// import { Go, Global } from './go';

let instance: GoWrapper;
let wrapper: StdioWrapper;

interface LifecycleListener {
  onExit: (code: number) => void
}

export const goRun = async (m: WebAssembly.WebAssemblyInstantiatedSource) => {
  if (!instance) {
    throw new Error('Go runner instance is not initialized');
  }

  wrapper.reset();
  return instance.run(m.instance as GoWebAssemblyInstance);
};

export const getImportObject = () => instance.importObject;

export const bootstrapGo = (logger: ConsoleLogger, listener: LifecycleListener) => {
  if (instance) {
    // Skip double initialization
    return;
  }

  // Wrap Go's calls to os.Stdout and os.Stderr
  wrapper = new StdioWrapper(logger);

  // global overlay
  const mocks = {
    mocked: true,
    fs: new FileSystemWrapper(wrapper.stdoutPipe, wrapper.stderrPipe),
    process: ProcessStub
  };

  // Wrap global Window and Go object to intercept console calls.
  instance = new GoWrapper(new globalThis.Go(), {
    globalValue: wrapGlobal(mocks, globalThis),
  });

  instance.onExit = (code: number) => {
    console.log('Go: WebAssembly program finished with code:', code);
    listener.onExit(code);
  }
};
