import {FileInfo, FileStore, FileType} from "~/lib/gowasm/bindings/browserfs";
import {Errno, SyscallError} from "~/lib/go/pkg/syscall";
import {FileNode, PackageCacheDB} from "./db";
import {baseName, dirName, trimSlash} from "./utils";

/**
 * PackageFileStore implements FileStore interface for Go packages cache.
 */
export class PackageFileStore implements FileStore {
  constructor(private db: PackageCacheDB) {}

  async stat(name: string): Promise<FileInfo> {
    const result = await this.lookupFile(trimSlash(name));
    if (!result) {
      throw new SyscallError(Errno.ENOENT);
    }

    return result;
  }

  async readDir(name: string): Promise<FileInfo[]> {
    const inode = await this.stat(trimSlash(name));
    if (inode.fileType !== FileType.Directory) {
      throw new SyscallError(Errno.ENOTDIR);
    }

    const children = await this.db.inodes.where({
      parentId: inode.id,
    }).toArray();

    return children;
  }

  async readFile(fileId: number) {
    const data = await this.db.fileData.get(fileId);
    if (!data) {
      throw new SyscallError(Errno.ENOENT);
    }

    return data.data;
  }

  async writeFile(name: string, data: Uint8Array) {
    // Overwrite file if it already exists
    const normFileName = trimSlash(name);
    const inode = await this.lookupFile(normFileName);
    if (!inode) {
      await this.createFile(normFileName, data);
      return;
    }

    if (inode.fileType === FileType.Directory) {
      throw new SyscallError(Errno.EISDIR);
    }

    await this.db.inodes.update(inode.id!, {
      createdAt: Date.now(),
      size: data.length,
    });

    // Replace old file contents
    await this.db.fileData.update(inode.id, {
      data: data,
    });
  }

  private async createFile(name: string, data: Uint8Array) {
    let parentId = 0;
    const parentDirName = dirName(name);
    if (parentDirName.length) {
      const parentNode = await this.lookupFile(name);
      if (!parentNode) {
        throw new SyscallError(Errno.ENOENT);
      }

      if (parentNode.fileType !== FileType.Directory) {
        throw new SyscallError(Errno.ENOTDIR);
      }
      parentId = parentNode.id!;
    }

    const createdId = await this.createInode({
      parentId,
      absolutePath: name,
      name: baseName(name),
      fileType: FileType.Regular,
      size: data.length,
      createdAt: Date.now(),
    });
    await this.db.fileData.add({
      inodeId: createdId,
      data: data,
    }, createdId);
  }

  async makeDir(name: string) {
    name = trimSlash(name);
    const node = await this.lookupFile(name);
    if (node) {
      if (node.fileType !== FileType.Directory) {
        throw new SyscallError(Errno.ENOTDIR);
      }
      return;
    }

    const parentId = await this.mkdirAll(dirName(name));
    await this.createInode({
      parentId,
      absolutePath: name,
      name: baseName(name),
      fileType: FileType.Directory,
      size: 0,
      createdAt: Date.now(),
    });
  }

  async unlink(name: string) {
    name = trimSlash(name);
    const node = await this.lookupFile(name);
    if (!node) {
      throw new SyscallError(Errno.ENOENT);
    }

    await this.unlinkNode(node);
  }

  private async unlinkNode(node: FileNode) {
    switch (node.fileType) {
      case FileType.Directory:
        const children = await this.db.inodes.where({
          parentId: node.id,
        }).toArray();
        if (children.length > 0) {
          await Promise.all(children.map(n => this.unlinkNode(n)));
        }
        break;
      case FileType.Regular:
        await this.db.fileData.delete(node.id);
        break;
      default:
        break;
    }

    await this.db.inodes.delete(node.id);
  }

  private async mkdirAll(name: string): Promise<number> {
    const node = await this.lookupFile(name);
    if (node) {
      if (node.fileType !== FileType.Directory) {
        throw new SyscallError(Errno.ENOTDIR);
      }
      return node.id;
    }

    const parentId = await this.mkdirAll(dirName(name));
    const createdId = await this.createInode({
      parentId,
      absolutePath: name,
      name: baseName(name),
      fileType: FileType.Directory,
      size: 0,
      createdAt: Date.now(),
    });
    return createdId;
  }

  private async lookupFile(name: string) {
    return this.db.inodes.where({
      absolutePath: name
    }).limit(1).first();
  }

  private async createInode(inode: Omit<FileNode, 'id'>): Promise<number> {
    return this.db.inodes.add((inode as unknown) as FileNode);
  }
}
