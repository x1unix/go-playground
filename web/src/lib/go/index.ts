export * from './debug';
export * from './stack';
export * from './types';
export { GoWrapper, wrapGlobal } from './wrapper/wrapper';
export { instantiateStreaming } from './common';
export type { GoWebAssemblyInstance } from './wrapper/instance';

export * as js from './pkg/syscall/js';
