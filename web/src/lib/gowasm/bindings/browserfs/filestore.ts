import {Inode} from './types';

export interface FileInfo extends Omit<Inode, 'name'> {
  name: string
}

/**
 * FileStore is abstract implementation of file store.
 */
export interface FileStore {
  /**
   * Checks if file entry exists and returns information about a file.
   *
   * @throws SyscallError(Errno.ENOENT) if file doesn't exist.
   * @param name
   */
  stat(name: string): Promise<FileInfo>

  /**
   * Returns a list of entries in directory.
   *
   * @throws SyscallError(Errno.ENOENT) if directory doesn't exist.
   * @param name
   */
  readDir(name: string): Promise<FileInfo[]>

  /**
   * Returns file contents.
   *
   * @throws SyscallError(Errno.ENOENT) if file doesn't exist.
   * @param fileId
   */
  readFile(fileId: number): Promise<Uint8Array>

  /**
   * Creates a new or overwrites an existing file with specified contents.
   *
   * @param name File name
   * @param data New contents
   */
  writeFile(name: string, data: Uint8Array): Promise<void>

  /**
   * Creates a new directory, including its parent.
   *
   * @param name Directory name.
   */
  makeDir(name: string): Promise<void>

  /**
   * Removes file or directory, including its contents.
   *
   * @throws SyscallError(Errno.ENOENT) if file doesn't exist.
   * @param name
   */
  unlink(name: string): Promise<void>
}
