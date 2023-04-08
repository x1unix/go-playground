import {Inode} from './go';

export interface FileInfo extends Omit<Inode, 'name'> {
  name: string
}

/**
 * FileStore is abstract implementation of file store.
 */
export interface FileStore {
  stat(name: string): Promise<FileInfo>
  readDir(name: string): Promise<FileInfo[]>
  readFile(fileInfo: FileInfo): Promise<Uint8Array>
  writeFile(name: string, data: Uint8Array): Promise<void>
  makeDir(name: string): Promise<void>
  unlink(name: string): Promise<void>
}
