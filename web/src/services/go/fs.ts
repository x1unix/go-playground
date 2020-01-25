import { NodeCallback } from './foundation';

export type FileDescriptor = number;

export const STDOUT: FileDescriptor = 1;
export const STDERR: FileDescriptor = 2;

/**
 * IWriter is abstract writer interface
 */
export interface IWriter {
    // write writes data and returns written bytes count
    write(data: Uint8Array): number
}

/**
 * FileSystem is wrapper class for FS simulation
 */
export class FileSystem {
    descriptors = new Map<FileDescriptor, IWriter>();
    readonly constants = {
        O_WRONLY: -1,
        O_RDWR: -1,
        O_CREAT: -1,
        O_TRUNC: -1,
        O_APPEND: -1,
        O_EXCL: -1
    };

    constructor(stdout: IWriter, stderr: IWriter) {
        this.descriptors.set(STDERR, stderr);
        this.descriptors.set(STDOUT, stdout);
    }

    writeSync(fd: FileDescriptor, buf: Uint8Array) {
        const writer = this.descriptors.get(fd);
        if (!writer) {
            const err = new Error('not implemented');
            err['code'] = 'ENOENT';
            throw err;
        }

        return writer.write(buf);
    }

    write(fd: FileDescriptor, buf: Uint8Array, offset: number, length: number, position: number, callback: NodeCallback<number>) {
        if (offset !== 0 || length !== buf.length || position !== null) {
            throw new Error("not implemented");
        }
        const n = this.writeSync(fd, buf);
        callback(null, n);
    }

    open(path: string, flags, mode, callback) {
        const err = new Error("not implemented");
        err['code'] = "ENOSYS";
        callback(err, null);
    }

    read(fd: FileDescriptor, buffer, offset: number, length: number, position: number, callback: NodeCallback<any>) {
        const err = new Error("not implemented");
        err['code'] = "ENOSYS";
        callback(err, null);
    }

    fsync(fd, callback) {
        callback(null);
    }
}