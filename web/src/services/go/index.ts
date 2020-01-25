import { FileSystemWrapper } from './fs';
import { Go, Global } from './go';
import {StdioWrapper, ConsoleLogger} from './stdio';

let instance: Go;

export const run = async(m: WebAssembly.Instance) => {
    if (!instance) {
        throw new Error('Go runner instance is not initialized');
    }

    return instance.run(m);
};

export const bootstrapGo = (logger: ConsoleLogger) => {
    if (instance) {
        // Skip double initialization
        return;
    }

    // Wrap Go's calls to os.Stdout and os.Stderr
    const w = new StdioWrapper(logger);
    const mocks = {
        fs: new FileSystemWrapper(w.stdoutPipe, w.stderrPipe),
    };

    // Wrap global object to make it accessible to Go's wasm bridge
    const globalWrapper = new Proxy<Global>(window as any, {
        has: (obj, prop) => prop in obj || prop in mocks,
        get: (obj, prop) => prop in obj ? obj[prop] : mocks[prop]
    });

    // Create instance
    instance = new Go(globalWrapper);
};