/**
 * Client-side environment for Go WASM programs
 */

import {decoder} from './foundation';
import {IWriter} from './fs';
import {EvalEventKind} from "../api";

export interface ConsoleLogger {
    log(eventType: EvalEventKind, message: string)
}

export class StdioWrapper {
    outputBuf = '';

    constructor(private logger: ConsoleLogger) {}

    private getWriter(kind: EvalEventKind) {
        return {
            write: (data: Uint8Array) => {
                this.outputBuf += decoder.decode(data);
                const nl = this.outputBuf.lastIndexOf('\n');
                if (nl !== -1) {
                    const message = this.outputBuf.substr(0, nl);
                    this.logger.log(kind, message);
                    this.outputBuf = this.outputBuf.substr(nl + 1);
                }
                return data.length;
            }
        };
    }

    reset() {
        this.outputBuf = '';
    }

    get stdoutPipe(): IWriter {
        return this.getWriter(EvalEventKind.Stdout);
    }

    get stderrPipe(): IWriter {
        return this.getWriter(EvalEventKind.Stderr);
    }
}