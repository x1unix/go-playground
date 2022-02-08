import { NodeCallback, enosys } from './foundation';

export type FileDescriptor = number;

export const STDOUT: FileDescriptor = 1;
export const STDERR: FileDescriptor = 2;

export interface IFileSystem {
  writeSync(fd: FileDescriptor, buf: Uint8Array): number
  write(fd: FileDescriptor, buf: Uint8Array, offset: number, length: number, position: number, callback: NodeCallback<number>)
  open(path: string, flags, mode, callback)
  fsync(fd, callback)
  chmod(path, mode, callback)
  chown(path, uid, gid, callback)
  close(fd, callback)
  fchmod(fd, mode, callback)
  fchown(fd, uid, gid, callback)
  fstat(fd, callback)
  fsync(fd, callback)
  ftruncate(fd, length, callback)
  lchown(path, uid, gid, callback)
  link(path, link, callback)
  lstat(path, callback)
  mkdir(path, perm, callback)
  open(path, flags, mode, callback)
  read(fd, buffer, offset, length, position, callback)
  readdir(path, callback)
  readlink(path, callback)
  rename(from, to, callback)
  rmdir(path, callback)
  stat(path, callback)
  symlink(path, link, callback)
  truncate(path, length, callback)
  unlink(path, callback)
  utimes(path, atime, mtime, callback)
}

/**
 * IWriter is abstract writer interface
 */
export interface IWriter {
  // write writes data and returns written bytes count
  write(data: Uint8Array): number
}

/**
 * FileSystemWrapper is file system stub implementation for browser
 *
 * Source: wasm_exec.js:39 in Go 1.14
 */
export class FileSystemWrapper {
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
      throw enosys();
    }

    return writer.write(buf);
  }

  write(fd: FileDescriptor, buf: Uint8Array, offset: number, length: number, position: number, callback: NodeCallback<number>) {
    if (offset !== 0 || length !== buf.length || position !== null) {
      callback(enosys(), null);
      return;
    }
    const n = this.writeSync(fd, buf);
    callback(null, n);
  }

  open(path: string, flags, mode, callback) {
    // TODO: implement file read-write
    callback(enosys(), null);
  }

  read(fd: FileDescriptor, buffer, offset: number, length: number, position: number, callback: NodeCallback<any>) {
    callback(enosys(), null);
  }

  fsync(fd, callback) {
    callback(null);
  }

  chmod(path, mode, callback) { callback(enosys()); }
  chown(path, uid, gid, callback) { callback(enosys()); }
  close(fd, callback) { callback(enosys()); }
  fchmod(fd, mode, callback) { callback(enosys()); }
  fchown(fd, uid, gid, callback) { callback(enosys()); }
  fstat(fd, callback) { callback(enosys()); }
  ftruncate(fd, length, callback) { callback(enosys()); }
  lchown(path, uid, gid, callback) { callback(enosys()); }
  link(path, link, callback) { callback(enosys()); }
  lstat(path, callback) { callback(enosys()); }
  mkdir(path, perm, callback) { callback(enosys()); }
  readdir(path, callback) { callback(enosys()); }
  readlink(path, callback) { callback(enosys()); }
  rename(from, to, callback) { callback(enosys()); }
  rmdir(path, callback) { callback(enosys()); }
  stat(path, callback) { callback(enosys()); }
  symlink(path, link, callback) { callback(enosys()); }
  truncate(path, length, callback) { callback(enosys()); }
  unlink(path, callback) { callback(enosys()); }
  utimes(path, atime, mtime, callback) { callback(enosys()); }
}
