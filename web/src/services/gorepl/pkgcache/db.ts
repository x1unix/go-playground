import Dexie from "dexie";
import {FileInfo} from "~/lib/gowasm/bindings/browserfs";

export interface FileData {
  inodeId: number,
  data: Uint8Array
}

export interface FileNode extends FileInfo {
  parentId: number;
  absolutePath: string;
}

export class PackageCacheDB extends Dexie {
  /**
   * Table to store file attributes (inodes).
   */
  inodes!: Dexie.Table<FileNode, number>;

  /**
   * Table to store file contents.
   */
  fileData!: Dexie.Table<FileData>;

  constructor() {
    super('PackageCache');
    this.version(1).stores({
      inodes: `++id, parentId, absolutePath`,
      data: `&inodeId`,
    });
  }
}
