import {IFileSystem} from "./fs";
import {encoder, decoder} from './foundation';

const MAX_UINT32 = 4294967296;
const NAN_HEAD = 0x7FF80000;
const MS_IN_NANO = 1000000;

export interface Global extends Window {
    fs: IFileSystem
}

export class Go {
    argv = ['js'];
    env: {[k: string]: string} = {};
    timeOrigin = Date.now() - performance.now();
    exited = false;
    private pendingEvent: any = null;
    private scheduledTimeouts = new Map<number, any>();
    private nextCallbackTimeoutID = 1;
    private _resolveExitPromise?: (val?: any) => void;
    private exitPromise = new Promise((resolve) => {
        this._resolveExitPromise = resolve;
    });

    private inst: any;
    private values: any[] = [];
    private refs = new Map();

    constructor(private global: Global) {}

    get mem() {
        // The buffer may change when requesting more memory.
        return new DataView(this.inst.exports.mem.buffer);
    }

    setInt64(addr, v) {
        this.mem.setUint32(addr + 0, v, true);
        this.mem.setUint32(addr + 4, Math.floor(v / MAX_UINT32), true);
    }

    getInt64(addr) {
        const low = this.mem.getUint32(addr + 0, true);
        const high = this.mem.getInt32(addr + 4, true);
        return low + high * MAX_UINT32;
    }

    loadValue(addr: number) {
        const f = this.mem.getFloat64(addr, true);
        if (f === 0) {
            return undefined;
        }
        if (!isNaN(f)) {
            return f;
        }

        const id = this.mem.getUint32(addr, true);
        return this.values[id];
    }

    storeValue(addr, v) {
        if (typeof v === "number") {
            if (isNaN(v)) {
                this.mem.setUint32(addr + 4, NAN_HEAD, true);
                this.mem.setUint32(addr, 0, true);
                return;
            }
            if (v === 0) {
                this.mem.setUint32(addr + 4, NAN_HEAD, true);
                this.mem.setUint32(addr, 1, true);
                return;
            }
            this.mem.setFloat64(addr, v, true);
            return;
        }

        switch (v) {
            case undefined:
                this.mem.setFloat64(addr, 0, true);
                return;
            case null:
                this.mem.setUint32(addr + 4, NAN_HEAD, true);
                this.mem.setUint32(addr, 2, true);
                return;
            case true:
                this.mem.setUint32(addr + 4, NAN_HEAD, true);
                this.mem.setUint32(addr, 3, true);
                return;
            case false:
                this.mem.setUint32(addr + 4, NAN_HEAD, true);
                this.mem.setUint32(addr, 4, true);
                return;
        }

        let ref = this.refs.get(v);
        if (ref === undefined) {
            ref = this.values.length;
            this.values.push(v);
            this.refs.set(v, ref);
        }
        let typeFlag = 0;
        switch (typeof v) {
            case "string":
                typeFlag = 1;
                break;
            case "symbol":
                typeFlag = 2;
                break;
            case "function":
                typeFlag = 3;
                break;
        }
        this.mem.setUint32(addr + 4, NAN_HEAD | typeFlag, true);
        this.mem.setUint32(addr, ref, true);
    }

    loadSlice(addr) {
        const array = this.getInt64(addr + 0);
        const len = this.getInt64(addr + 8);
        return new Uint8Array(this.inst.exports.mem.buffer, array, len);
    }

    loadSliceOfValues(addr) {
        const array = this.getInt64(addr + 0);
        const len = this.getInt64(addr + 8);
        const a = new Array(len);
        for (let i = 0; i < len; i++) {
            a[i] = this.loadValue(array + i * 8);
        }
        return a;
    }

    loadString(addr) {
        const saddr = this.getInt64(addr + 0);
        const len = this.getInt64(addr + 8);
        return decoder.decode(new DataView(this.inst.exports.mem.buffer, saddr, len));
    }

    importObject = {
        go: {
            // Go's SP does not change as long as no Go code is running. Some operations (e.g. calls, getters and setters)
            // may synchronously trigger a Go event handler. This makes Go code get executed in the middle of the imported
            // function. A goroutine can switch to a new stack if the current stack is too small (see morestack function).
            // This changes the SP, thus we have to update the SP used by the imported function.

            // func wasmExit(code int32)
            "runtime.wasmExit": (sp) => {
                const code = this.mem.getInt32(sp + 8, true);
                this.exited = true;
                delete this.inst;
                delete this.values;
                delete this.refs;
                this.exit(code);
            },

            // func wasmWrite(fd uintptr, p unsafe.Pointer, n int32)
            "runtime.wasmWrite": (sp) => {
                const fd = this.getInt64(sp + 8);
                const p = this.getInt64(sp + 16);
                const n = this.mem.getInt32(sp + 24, true);
                this.global.fs.writeSync(fd, new Uint8Array(this.inst.exports.mem.buffer, p, n));
            },

            // func nanotime() int64
            "runtime.nanotime": (sp) => {
                this.setInt64(sp + 8, (this.timeOrigin + performance.now()) * MS_IN_NANO);
            },

            // func walltime() (sec int64, nsec int32)
            "runtime.walltime": (sp) => {
                const msec = (new Date).getTime();
                this.setInt64(sp + 8, msec / 1000);
                this.mem.setInt32(sp + 16, (msec % 1000) * MS_IN_NANO, true);
            },

            // func scheduleTimeoutEvent(delay int64) int32
            "runtime.scheduleTimeoutEvent": (sp) => {
                const id = this.nextCallbackTimeoutID;
                this.nextCallbackTimeoutID++;
                this.scheduledTimeouts.set(id, setTimeout(
                    () => {
                        this.resume();
                        while (this.scheduledTimeouts.has(id)) {
                            // for some reason Go failed to register the timeout event, log and try again
                            // (temporary workaround for https://github.com/golang/go/issues/28975)
                            console.warn("scheduleTimeoutEvent: missed timeout event");
                            this.resume();
                        }
                    },
                    this.getInt64(sp + 8) + 1, // setTimeout has been seen to fire up to 1 millisecond early
                ));
                this.mem.setInt32(sp + 16, id, true);
            },

            // func clearTimeoutEvent(id int32)
            "runtime.clearTimeoutEvent": (sp) => {
                const id = this.mem.getInt32(sp + 8, true);
                clearTimeout(this.scheduledTimeouts.get(id));
                this.scheduledTimeouts.delete(id);
            },

            // func getRandomData(r []byte)
            "runtime.getRandomData": (sp) => {
                crypto.getRandomValues(this.loadSlice(sp + 8));
            },

            // func stringVal(value string) ref
            "syscall/js.stringVal": (sp) => {
                this.storeValue(sp + 24, this.loadString(sp + 8));
            },

            // func valueGet(v ref, p string) ref
            "syscall/js.valueGet": (sp) => {
                const result = Reflect.get(this.loadValue(sp + 8), this.loadString(sp + 16));
                sp = this.inst.exports.getsp(); // see comment above
                this.storeValue(sp + 32, result);
            },

            // func valueSet(v ref, p string, x ref)
            "syscall/js.valueSet": (sp) => {
                Reflect.set(this.loadValue(sp + 8), this.loadString(sp + 16), this.loadValue(sp + 32));
            },

            // func valueIndex(v ref, i int) ref
            "syscall/js.valueIndex": (sp) => {
                this.storeValue(sp + 24, Reflect.get(this.loadValue(sp + 8), this.getInt64(sp + 16)));
            },

            // valueSetIndex(v ref, i int, x ref)
            "syscall/js.valueSetIndex": (sp) => {
                Reflect.set(this.loadValue(sp + 8), this.getInt64(sp + 16), this.loadValue(sp + 24));
            },

            // func valueCall(v ref, m string, args []ref) (ref, bool)
            "syscall/js.valueCall": (sp) => {
                try {
                    const v = this.loadValue(sp + 8);
                    const m = Reflect.get(v, this.loadString(sp + 16));
                    const args = this.loadSliceOfValues(sp + 32);
                    const result = Reflect.apply(m, v, args);
                    sp = this.inst.exports.getsp(); // see comment above
                    this.storeValue(sp + 56, result);
                    this.mem.setUint8(sp + 64, 1);
                } catch (err) {
                    this.storeValue(sp + 56, err);
                    this.mem.setUint8(sp + 64, 0);
                }
            },

            // func valueInvoke(v ref, args []ref) (ref, bool)
            "syscall/js.valueInvoke": (sp) => {
                try {
                    const v = this.loadValue(sp + 8);
                    const args = this.loadSliceOfValues(sp + 16);
                    const result = Reflect.apply(v, undefined, args);
                    sp = this.inst.exports.getsp(); // see comment above
                    this.storeValue(sp + 40, result);
                    this.mem.setUint8(sp + 48, 1);
                } catch (err) {
                    this.storeValue(sp + 40, err);
                    this.mem.setUint8(sp + 48, 0);
                }
            },

            // func valueNew(v ref, args []ref) (ref, bool)
            "syscall/js.valueNew": (sp) => {
                try {
                    const v = this.loadValue(sp + 8);
                    const args = this.loadSliceOfValues(sp + 16);
                    const result = Reflect.construct(v, args);
                    sp = this.inst.exports.getsp(); // see comment above
                    this.storeValue(sp + 40, result);
                    this.mem.setUint8(sp + 48, 1);
                } catch (err) {
                    this.storeValue(sp + 40, err);
                    this.mem.setUint8(sp + 48, 0);
                }
            },

            // func valueLength(v ref) int
            "syscall/js.valueLength": (sp) => {
                this.setInt64(sp + 16, parseInt(this.loadValue(sp + 8).length));
            },

            // valuePrepareString(v ref) (ref, int)
            "syscall/js.valuePrepareString": (sp) => {
                const str = encoder.encode(String(this.loadValue(sp + 8)));
                this.storeValue(sp + 16, str);
                this.setInt64(sp + 24, str.length);
            },

            // valueLoadString(v ref, b []byte)
            "syscall/js.valueLoadString": (sp) => {
                const str = this.loadValue(sp + 8);
                this.loadSlice(sp + 16).set(str);
            },

            // func valueInstanceOf(v ref, t ref) bool
            "syscall/js.valueInstanceOf": (sp) => {
                this.mem.setUint8(sp + 24, Number(this.loadValue(sp + 8) instanceof this.loadValue(sp + 16)));
            },

            // func copyBytesToGo(dst []byte, src ref) (int, bool)
            "syscall/js.copyBytesToGo": (sp) => {
                const dst = this.loadSlice(sp + 8);
                const src = this.loadValue(sp + 32);
                if (!(src instanceof Uint8Array)) {
                    this.mem.setUint8(sp + 48, 0);
                    return;
                }
                const toCopy = src.subarray(0, dst.length);
                dst.set(toCopy);
                this.setInt64(sp + 40, toCopy.length);
                this.mem.setUint8(sp + 48, 1);
            },

            // func copyBytesToJS(dst ref, src []byte) (int, bool)
            "syscall/js.copyBytesToJS": (sp) => {
                const dst = this.loadValue(sp + 8);
                const src = this.loadSlice(sp + 16);
                if (!(dst instanceof Uint8Array)) {
                    this.mem.setUint8(sp + 48, 0);
                    return;
                }
                const toCopy = src.subarray(0, dst.length);
                dst.set(toCopy);
                this.setInt64(sp + 40, toCopy.length);
                this.mem.setUint8(sp + 48, 1);
            },

            "debug": (value) => {
                console.log(value);
            },
        },
    };

    public async run(instance: WebAssembly.Instance) {
        this.inst = instance;
        this.values = [ // TODO: garbage collection
            NaN,
            0,
            null,
            true,
            false,
            global,
            this,
        ];
        this.refs = new Map();
        this.exited = false;

        const mem = new DataView(this.inst.exports.mem.buffer);

        // Pass command line arguments and environment variables to WebAssembly by writing them to the linear memory.
        let offset = 4096;

        const strPtr = (str) => {
            const ptr = offset;
            const bytes = encoder.encode(str + "\0");
            new Uint8Array(mem.buffer, offset, bytes.length).set(bytes);
            offset += bytes.length;
            if (offset % 8 !== 0) {
                offset += 8 - (offset % 8);
            }
            return ptr;
        };

        const argc = this.argv.length;

        const argvPtrs: number[] = [];
        this.argv.forEach((arg) => {
            argvPtrs.push(strPtr(arg));
        });

        const keys = Object.keys(this.env).sort();
        argvPtrs.push(keys.length);
        keys.forEach((key) => {
            argvPtrs.push(strPtr(`${key}=${this.env[key]}`));
        });

        const argv = offset;
        argvPtrs.forEach((ptr) => {
            mem.setUint32(offset, ptr, true);
            mem.setUint32(offset + 4, 0, true);
            offset += 8;
        });

        this.inst.exports.run(argc, argv);
        if (this.exited) {
            this._resolveExitPromise && this._resolveExitPromise();
        }
        await this.exitPromise;
    }

    resume() {
        if (this.exited) {
            throw new Error("Go program has already exited");
        }
        this.inst.exports.resume();
        if (this.exited) {
            this._resolveExitPromise && this._resolveExitPromise();
        }
    }

    makeFuncWrapper(id) {
        const go = this;
        return function () {
            // @ts-ignore
            const event: any = { id: id, this: this, args: arguments };
            go.pendingEvent = event;
            go.resume();
            return event.result;
        };
    }

    exit(code = 0) {
        if (code !== 0) {
            console.warn('exit code: ', code);
        }
    }
}