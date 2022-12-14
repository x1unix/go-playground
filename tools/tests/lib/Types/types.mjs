import { BooleanTypeSpec, DataViewableTypeSpec, UInt64TypeSpec } from './primitive.mjs';
export * from './common.mjs';

export const Types = {
  // Common type aliases
  Boolean: new BooleanTypeSpec(),
  Int: new UInt64TypeSpec('int'),
  Uint: new UInt64TypeSpec('uint'),
  UintPtr: new UInt64TypeSpec('uintptr'),

  Byte: new DataViewableTypeSpec('byte', 1, 1, 0, {
    read: DataView.prototype.getUint8,
    write: DataView.prototype.setUint8
  }),

  // Go stores int8 with padding because minimal supported data type by assembly is uint32.
  Uint8: new DataViewableTypeSpec('uint8', 1, 1, 3, {
    read: DataView.prototype.getUint8,
    write: DataView.prototype.setUint8
  }),
  Int8: new DataViewableTypeSpec('int8', 1, 1, 3, {
    read: DataView.prototype.getInt8,
    write: DataView.prototype.setInt8
  }),

  Uint32: new DataViewableTypeSpec('uint32', 4, 4, 0, {
    read: DataView.prototype.getUint32,
    write: DataView.prototype.setUint32
  }),
  Int32: new DataViewableTypeSpec('int32', 4, 4, 0, {
    read: DataView.prototype.getInt32,
    write: DataView.prototype.setInt32
  }),
  Uint64: new DataViewableTypeSpec('uint64', 8, 8, 0, {
    read: DataView.prototype.getBigUint64,
    write: DataView.prototype.setBigUint64
  }),
  Int64: new DataViewableTypeSpec('int64', 8, 8, 0, {
    read: DataView.prototype.getBigInt64,
    write: DataView.prototype.setBigInt64
  }),
  Float32: new DataViewableTypeSpec('float32', 4, 4, 0, {
    read: DataView.prototype.getFloat32,
    write: DataView.prototype.setFloat32
  }),
  Float64: new DataViewableTypeSpec('float64', 8, 8, 0, {
    read: DataView.prototype.getFloat64,
    write: DataView.prototype.setFloat64
  }),
}
