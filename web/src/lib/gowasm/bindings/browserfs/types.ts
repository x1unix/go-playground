import { UInt8ArrayTypeSpec, Int64, Struct, Uint8, UintPtr } from '~/lib/go'
import { newPackageSymbolFunc } from '../../utils'

export const MAX_FILE_NAME_LEN = 128
export const PKG_NAME = 'github.com/x1unix/go-playground/internal/gowasm/browserfs'

export const sym = newPackageSymbolFunc(PKG_NAME)

export interface SizedFileName {
  len: number
  data: Uint8Array
}

export enum FileType {
  Zero = 0,
  Regular = 1,
  Directory = 2,
  SymLink = 3,
}

export interface Inode {
  id: number
  parentId: number
  fileType: FileType
  size: number
  createdAt: number
  name: SizedFileName
}

export const TSizedFileName = Struct<SizedFileName>(sym('sizedFileName'), [
  { key: 'len', type: Uint8 },
  { key: 'data', type: new UInt8ArrayTypeSpec(MAX_FILE_NAME_LEN) },
])

export const TInode = Struct<Inode>(sym('inode'), [
  { key: 'id', type: UintPtr },
  { key: 'parentId', type: UintPtr },
  { key: 'fileType', type: Uint8 },
  { key: 'size', type: Int64 },
  { key: 'createdAt', type: Int64 },
  { key: 'name', type: TSizedFileName },
])
