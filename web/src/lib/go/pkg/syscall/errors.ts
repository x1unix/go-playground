import {Errno, errorMessages} from './tables';

/**
 * Key-value mapping to DOM exception name and syscall error code.
 */
const codeSyscallMap: {[k: string]: Errno} = {
  'QuotaExceededError': Errno.ENOSPC,
  'SecurityError': Errno.EPERM,
  'NetworkError': Errno.ENETRESET,
  'TimeoutError': Errno.ETIMEDOUT,
  'DataCloneError': Errno.EPIPE
}

const unwrapError = (err: Error): Error => (
  err['inner'] ?? err
);

/**
 * SyscallError is syscall execution error which contains error code.
 *
 * Usually passed back to a callback handler.
 */
export class SyscallError extends Error {
  constructor(public errno: Errno) {
    super(`Syscall error: ${errorMessages.get(errno) ?? Errno[errno]}`);
  }

  /**
   * Checks is error is a syscall error with specified error code.
   *
   * @param err Source error
   * @param errno Compared error code.
   */
  static is(err: Error, errno: Errno): boolean {
    if (!(err instanceof SyscallError)) {
      return false;
    }

    return err.errno === errno;
  }

  /**
   * Constructs SyscallError from passed error.
   *
   * Returns passed error if it already is a SyscallError.
   * Otherwise, returns a new SyscallError with Errno.EIO.
   *
   * @param err
   */
  static fromError(err: Error | Errno): SyscallError {
    if (typeof err === 'number') {
      return new SyscallError(err);
    }

    if (err instanceof SyscallError) {
      return err;
    }

    const unwrapped = unwrapError(err);
    const errCode = codeSyscallMap[unwrapped.name] ?? Errno.EIO;
    return new SyscallError(errCode);
  }
}
