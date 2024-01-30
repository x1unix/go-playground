import { type FileInfo, type FileStore, FileType } from '~/lib/gowasm/bindings/browserfs'
import { Errno, SyscallError } from '~/lib/go/pkg/syscall'
import { type FileNode, type PackageCacheDB } from './db'
import { baseName, dirName, trimSlash } from './utils'

/**
 * PackageFileStore implements FileStore interface for Go packages cache.
 */
export class PackageFileStore implements FileStore {
  constructor(
    private readonly db: PackageCacheDB,
    private readonly debug = false,
  ) {}

  async stat(name: string): Promise<FileInfo> {
    const result = await this.lookupFile(trimSlash(name))
    if (!result) {
      throw new SyscallError(Errno.ENOENT)
    }

    return result
  }

  async readDir(name: string): Promise<FileInfo[]> {
    if (this.debug) console.log('readDir', name)
    const inode = await this.stat(trimSlash(name))
    if (inode.fileType !== FileType.Directory) {
      throw new SyscallError(Errno.ENOTDIR)
    }

    const children = await this.db.inodes
      .where({
        parentId: inode.id,
      })
      .toArray()

    return children
  }

  async readFile(fileId: number) {
    if (this.debug) console.log('readFile', fileId)
    const data = await this.db.fileContents.get(fileId)
    if (!data) {
      throw new SyscallError(Errno.ENOENT)
    }

    return data.data
  }

  async writeFile(name: string, data: Uint8Array) {
    // Overwrite file if it already exists
    if (this.debug) console.log('writeFile', name)
    const normFileName = trimSlash(name)
    const inode = await this.lookupFile(normFileName)
    if (!inode) {
      await this.createFile(normFileName, data)
      return
    }

    if (inode.fileType === FileType.Directory) {
      throw new SyscallError(Errno.EISDIR)
    }

    await this.db.inodes.update(inode.id, {
      createdAt: Date.now(),
      size: data.length,
    })

    // Replace old file contents
    await this.db.fileContents.update(inode.id, {
      data,
    })
  }

  private async createFile(name: string, data: Uint8Array) {
    if (this.debug) console.log('createFile', name)
    let parentId = 0
    const parentDirName = dirName(name)
    if (parentDirName.length) {
      const parentNode = await this.lookupFile(parentDirName)
      if (!parentNode) {
        throw new SyscallError(Errno.ENOENT)
      }

      if (parentNode.fileType !== FileType.Directory) {
        throw new SyscallError(Errno.ENOTDIR)
      }
      parentId = parentNode.id!
    }

    const createdId = await this.createInode({
      parentId,
      absolutePath: name,
      name: baseName(name),
      fileType: FileType.Regular,
      size: data.length,
      createdAt: Date.now(),
    })
    await this.db.fileContents.add(
      {
        inodeId: createdId,
        data,
      },
      createdId,
    )
  }

  async makeDir(name: string) {
    if (this.debug) console.log('makeDir', name)
    name = trimSlash(name)
    const node = await this.lookupFile(name)
    if (node) {
      if (node.fileType !== FileType.Directory) {
        throw new SyscallError(Errno.ENOTDIR)
      }
      return
    }

    const parentId = await this.mkdirAll(dirName(name))
    await this.createInode({
      parentId,
      absolutePath: name,
      name: baseName(name),
      fileType: FileType.Directory,
      size: 0,
      createdAt: Date.now(),
    })
  }

  async unlink(name: string) {
    if (this.debug) console.log('unlink', name)
    name = trimSlash(name)
    const node = await this.lookupFile(name)
    if (!node) {
      throw new SyscallError(Errno.ENOENT)
    }

    await this.unlinkNode(node)
  }

  private async unlinkNode(node: FileNode) {
    if (this.debug) console.log('unlinkNode', node.id)
    switch (node.fileType) {
      case FileType.Directory:
        const children = await this.db.inodes
          .where({
            parentId: node.id,
          })
          .toArray()
        if (children.length > 0) {
          await Promise.all(
            children.map(async (n) => {
              await this.unlinkNode(n)
            }),
          )
        }
        break
      case FileType.Regular:
        await this.db.fileContents.delete(node.id)
        break
      default:
        break
    }

    await this.db.inodes.delete(node.id)
  }

  private async mkdirAll(name: string): Promise<number> {
    if (this.debug) console.log('mkDirAll', name)
    if (name === '') {
      return 0
    }

    const node = await this.lookupFile(name)
    if (node) {
      if (node.fileType !== FileType.Directory) {
        throw new SyscallError(Errno.ENOTDIR)
      }
      return node.id
    }

    const parentId = await this.mkdirAll(dirName(name))
    const createdId = await this.createInode({
      parentId,
      absolutePath: name,
      name: baseName(name),
      fileType: FileType.Directory,
      size: 0,
      createdAt: Date.now(),
    })
    return createdId
  }

  private async lookupFile(name: string) {
    return await this.db.inodes
      .where({
        absolutePath: name,
      })
      .limit(1)
      .first()
  }

  private async createInode(inode: Omit<FileNode, 'id'>): Promise<number> {
    if (this.debug) console.log('createInode', inode)
    return await this.db.inodes.add(inode as unknown as FileNode)
  }
}
