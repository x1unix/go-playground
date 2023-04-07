import { ArrayTypeSpec, Int64, Struct, Uint64, Uint8 } from '~/lib/go';
import { newPackageSymbolFunc } from '../utils';

export const MAX_FILE_NAME_LEN = 128;
export const PKG_NAME = 'github.com/x1unix/go-playground/internal/gowasm/browserfs';

export const sym = newPackageSymbolFunc(PKG_NAME);

export interface SizedFileName {
  len: number
  data: number[]
}

export enum FileType {
  Zero = 0,
  Regular = 1,
  Directory = 2,
  SymLink = 3,
}

export interface INode {
  id: number
  parentId: number
  fileType: FileType
  size: number
  name: SizedFileName
}

export const TSizedFileName = Struct<SizedFileName>(sym('sizedFileName'), [
  { key: 'len', type: Uint8 },
  { key: 'data', type: new ArrayTypeSpec(Uint8, MAX_FILE_NAME_LEN) }
]);

export const TInode = Struct<INode>(sym('inode'), [
  { key: 'id', type: Uint64},
  { key: 'parentId', type: Uint64 },
  { key: 'fileType', type: Uint8 },
  { key: 'size', type: Int64 },
  { key: 'createdAt', type: Int64 },
  { key: 'name', type: TSizedFileName },
]);


