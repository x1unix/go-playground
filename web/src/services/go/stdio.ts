/**
 * Client-side environment for Go WASM programs
 */

import { encoder, decoder } from './foundation';
import {FileDescriptor, IWriter} from './fs';
import {DispatchFn} from '../../store/dispatch';
import {newProgramWriteAction} from '../../store/actions';
import {EvalEventKind} from "../api";

export class ConsoleWriter {
    outputBuf = '';
    private dispatchFn?: DispatchFn;

    setDispatchHook(fn: DispatchFn) {
        this.dispatchFn = fn;
    }

    private getWriter(kind: EvalEventKind) {
        return {
            write: (data: Uint8Array) => {
                this.outputBuf += decoder.decode(data);
                const nl = this.outputBuf.lastIndexOf('\n');
                if (nl != -1) {
                    const message = this.outputBuf.substr(0, nl);
                    console.log(message);
                    if (this.dispatchFn) {
                        this.dispatchFn(newProgramWriteAction({Message: message, Kind: kind, Delay: 0}));
                    }
                    this.outputBuf = this.outputBuf.substr(nl + 1);
                }
                return data.length;
            }
        };
    }

    get stdoutPipe(): IWriter {
        return this.getWriter(EvalEventKind.Stdout);
    }

    get stderrPipe(): IWriter {
        return this.getWriter(EvalEventKind.Stderr);
    }
}