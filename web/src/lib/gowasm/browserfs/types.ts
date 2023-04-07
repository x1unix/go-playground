import {INode} from './go';

/**
 * FileStore is abstract implementation of file store.
 */
export interface FileStore {
  stat(name: string): Promise<INode>
  readDir(name: string): Promise<INode[]>
  readFile(node: INode): Promise<ArrayBuffer>
  writeFile(name: string, data: ArrayBuffer): Promise<void>
  makeDir(name: string): Promise<void>
}
