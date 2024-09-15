export type uint = number
export type int = number
export type byte = number

export type bytes = number[]
export type NodeCallback<T> = (err: Error | null | undefined, result?: T | null) => void

export const encoder = new TextEncoder()
export const decoder = new TextDecoder('utf-8')

export class SyscallError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
  }
}

export const enosys = () => {
  return new SyscallError('ENOSYS', 'not implemented')
}
