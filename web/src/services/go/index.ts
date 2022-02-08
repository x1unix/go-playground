import { FileSystemWrapper } from './fs';
import ProcessStub from './process';
import { Global } from './go';
import { Go } from './wasm_exec';
import { StdioWrapper, ConsoleLogger } from './stdio';

// TODO: Uncomment, when "go.ts" will be fixed
// import { Go, Global } from './go';

let instance: Go;
let wrapper: StdioWrapper;

export const goRun = async (m: WebAssembly.WebAssemblyInstantiatedSource) => {
  if (!instance) {
    throw new Error('Go runner instance is not initialized');
  }

  wrapper.reset();
  return instance.run(m.instance);
};

export const getImportObject = () => instance.importObject;

export const bootstrapGo = (logger: ConsoleLogger) => {
  if (instance) {
    // Skip double initialization
    return;
  }

  // Wrap Go's calls to os.Stdout and os.Stderr
  wrapper = new StdioWrapper(logger);

  // global overlay
  const mocks = {
    fs: new FileSystemWrapper(wrapper.stdoutPipe, wrapper.stderrPipe),
    process: ProcessStub,
    Go: Go,
  };

  // Wrap global object to make it accessible to Go's wasm bridge
  const globalWrapper = new Proxy<Global>(window as any, {
    has: (obj, prop) => prop in obj || prop in mocks,
    get: (obj, prop) => {
      console.log('go: get %s', prop);
      return prop in obj ? obj[prop] : mocks[prop]
    }
  });
  instance = new Go(globalWrapper);
};
