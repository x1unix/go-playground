import { BooleanTypeSpec, DataViewableTypeSpec, UInt64TypeSpec } from './primitive.mjs';
export * from './common.mjs';

export const Types = {
  Boolean: new BooleanTypeSpec(),
  UintPtr: new UInt64TypeSpec('uintptr'),
  Byte: new DataViewableTypeSpec('byte', 1, 1, 0, DataView.prototype.getUint8),

  // Go stores int8 with padding because minimal supported data type by assembly is uint32.
  Uint8: new DataViewableTypeSpec('uint8', 1, 1, 3, DataView.prototype.getUint8),
  Int8: new DataViewableTypeSpec('int8', 1, 1, 3, DataView.prototype.getInt8),

  Uint32: new DataViewableTypeSpec('uint32', 4, 4, 0, DataView.prototype.getUint32),
  Int32: new DataViewableTypeSpec('int32', 4, 4, 0, DataView.prototype.getInt32),
  Uint64: new DataViewableTypeSpec('uint64', 8, 8, 0, DataView.prototype.getBigUint64),
  Int64: new DataViewableTypeSpec('int64', 8, 8, 0, DataView.prototype.getBigInt64),
  Float32: new DataViewableTypeSpec('float32', 4, 4, 0, DataView.prototype.getFloat32),
  Float64: new DataViewableTypeSpec('float64', 8, 8, 0, DataView.prototype.getFloat64),
}
