import { FileSystemWrapper } from './fs';
// import { Go, Global } from './go';
import { Go } from './wasm_exec';
import {StdioWrapper, ConsoleLogger} from './stdio';

let instance: Go;
let wrapper: StdioWrapper;

export const goRun = async(m: WebAssembly.WebAssemblyInstantiatedSource) => {
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

    // Monkey-patch global object to override some IO stuff (like FS)
    const globalWrapper = window as any;
    globalWrapper.global = window;
    globalWrapper.fs = new FileSystemWrapper(wrapper.stdoutPipe, wrapper.stderrPipe);
    globalWrapper.Go = Go;

    // TODO: Uncomment, when "go.ts" will be fixed
    // const mocks = {
    //     fs: new FileSystemWrapper(w.stdoutPipe, w.stderrPipe),
    //     Go: Go,
    // };
    //
    // // Wrap global object to make it accessible to Go's wasm bridge
    // const globalWrapper = new Proxy<Global>(window as any, {
    //     has: (obj, prop) => prop in obj || prop in mocks,
    //     get: (obj, prop) => {
    //         console.log('go: get %s', prop);
    //         return prop in obj ? obj[prop] : mocks[prop]
    //     }
    // });

    // Create instance
    // instance = new Go(globalWrapper);
    instance = new Go();
};