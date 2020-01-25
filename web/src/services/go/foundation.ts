export type uint = number;
export type int = number;
export type byte = number;

export type bytes = Array<number>;
export type NodeCallback<T> = (Error, T) => void;

export const encoder = new TextEncoder();
export const decoder = new TextDecoder('utf-8');