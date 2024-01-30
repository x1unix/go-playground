import { enosys } from './foundation'

const PROCID_STUB = -1
const CWD_STUB = '/'

/**
 * Minimal NodeJS.Process implementation for wasm_exec.js
 *
 * Source: wasm_exec.js:87 in Go 1.17
 */
const ProcessStub = {
  getuid() {
    return PROCID_STUB
  },
  getgid() {
    return PROCID_STUB
  },
  geteuid() {
    return PROCID_STUB
  },
  getegid() {
    return PROCID_STUB
  },
  getgroups() {
    throw enosys()
  },
  pid: PROCID_STUB,
  ppid: PROCID_STUB,
  umask() {
    throw enosys()
  },
  cwd() {
    return CWD_STUB
  },
  chdir() {
    throw enosys()
  },
} as any

export default ProcessStub as NodeJS.Process
