/**
 * Syscall error numbers.
 *
 * See: /go/src/syscall/tables_js.go
 */
export enum Errno {
  /**
   * Operation not permitted
   */
  EPERM = 1,

  /**
   * No such file or directory
   */
  ENOENT = 2,

  /**
   * No such process
   */
  ESRCH = 3,

  /**
   * Interrupted system call
   */
  EINTR = 4,

  /**
   * I/O error
   */
  EIO = 5,

  /**
   * No such device or address
   */
  ENXIO = 6,

  /**
   * Argument list too long
   */
  E2BIG = 7,

  /**
   * Exec format error
   */
  ENOEXEC = 8,

  /**
   * Bad file number
   */
  EBADF = 9,

  /**
   * No child processes
   */
  ECHILD = 10,

  /**
   * Try again
   */
  EAGAIN = 11,

  /**
   * Out of memory
   */
  ENOMEM = 12,

  /**
   * Permission denied
   */
  EACCES = 13,

  /**
   * Bad address
   */
  EFAULT = 14,

  /**
   * Device or resource busy
   */
  EBUSY = 16,

  /**
   * File exists
   */
  EEXIST = 17,

  /**
   * Cross-device link
   */
  EXDEV = 18,

  /**
   * No such device
   */
  ENODEV = 19,

  /**
   * Not a directory
   */
  ENOTDIR = 20,

  /**
   * Is a directory
   */
  EISDIR = 21,

  /**
   * Invalid argument
   */
  EINVAL = 22,

  /**
   * File table overflow
   */
  ENFILE = 23,

  /**
   * Too many open files
   */
  EMFILE = 24,

  /**
   * Not a typewriter
   */
  ENOTTY = 25,

  /**
   * File too large
   */
  EFBIG = 27,

  /**
   * No space left on device
   */
  ENOSPC = 28,

  /**
   * Illegal seek
   */
  ESPIPE = 29,

  /**
   * Read-only file system
   */
  EROFS = 30,

  /**
   * Too many links
   */
  EMLINK = 31,

  /**
   * Broken pipe
   */
  EPIPE = 32,

  /**
   * File name too long
   */
  ENAMETOOLONG = 36,

  /**
   * Function not implemented
   */
  ENOSYS = 38,

  /**
   * Quota exceeded
   */
  EDQUOT = 122,

  /**
   * Math arg out of domain of func
   */
  EDOM = 33,

  /**
   * Math result not representable
   */
  ERANGE = 34,

  /**
   * Deadlock condition
   */
  EDEADLK = 35,

  /**
   * No record locks available
   */
  ENOLCK = 37,

  /**
   * Directory not empty
   */
  ENOTEMPTY = 39,

  /**
   * Too many symbolic links
   */
  ELOOP = 40,

  /**
   * No message of desired type
   */
  ENOMSG = 42,

  /**
   * Identifier removed
   */
  EIDRM = 43,

  /**
   * Channel number out of range
   */
  ECHRNG = 44,

  /**
   * Level 2 not synchronized
   */
  EL2NSYNC = 45,

  /**
   * Level 3 halted
   */
  EL3HLT = 46,

  /**
   * Level 3 reset
   */
  EL3RST = 47,

  /**
   * Link number out of range
   */
  ELNRNG = 48,

  /**
   * Protocol driver not attached
   */
  EUNATCH = 49,

  /**
   * No CSI structure available
   */
  ENOCSI = 50,

  /**
   * Level 2 halted
   */
  EL2HLT = 51,

  /**
   * Invalid exchange
   */
  EBADE = 52,

  /**
   * Invalid request descriptor
   */
  EBADR = 53,

  /**
   * Exchange full
   */
  EXFULL = 54,

  /**
   * No anode
   */
  ENOANO = 55,

  /**
   * Invalid request code
   */
  EBADRQC = 56,

  /**
   * Invalid slot
   */
  EBADSLT = 57,

  /**
   * File locking deadlock error
   */
  EDEADLOCK = EDEADLK,

  /**
   * Bad font file fmt
   */
  EBFONT = 59,

  /**
   * Device not a stream
   */
  ENOSTR = 60,

  /**
   * No data (for no delay io)
   */
  ENODATA = 61,

  /**
   * Timer expired
   */
  ETIME = 62,

  /**
   * Out of streams resources
   */
  ENOSR = 63,

  /**
   * Machine is not on the network
   */
  ENONET = 64,

  /**
   * Package not installed
   */
  ENOPKG = 65,

  /**
   * The object is remote
   */
  EREMOTE = 66,

  /**
   * The link has been severed
   */
  ENOLINK = 67,

  /**
   * Advertise error
   */
  EADV = 68,

  /**
   * Srmount error
   */
  ESRMNT = 69,

  /**
   * Communication error on send
   */
  ECOMM = 70,

  /**
   * Protocol error
   */
  EPROTO = 71,

  /**
   * Multihop attempted
   */
  EMULTIHOP = 72,

  /**
   * Cross mount point (not really error)
   */
  EDOTDOT = 73,

  /**
   * Trying to read unreadable message
   */
  EBADMSG = 74,

  /**
   * Value too large for defined data type
   */
  EOVERFLOW = 75,

  /**
   * Given log. name not unique
   */
  ENOTUNIQ = 76,

  /**
   * f.d. invalid for this operation
   */
  EBADFD = 77,

  /**
   * Remote address changed
   */
  EREMCHG = 78,

  /**
   * Can't access a needed shared lib
   */
  ELIBACC = 79,

  /**
   * Accessing a corrupted shared lib
   */
  ELIBBAD = 80,

  /**
   * .lib section in a.out corrupted
   */
  ELIBSCN = 81,

  /**
   * Attempting to link in too many libs
   */
  ELIBMAX = 82,

  /**
   * Attempting to exec a shared library
   */
  ELIBEXEC = 83,

  /**
   * Illegal byte sequence.
   */
  EILSEQ = 84,

  /**
   * Too many users.
   */
  EUSERS = 87,

  /**
   * Socket operation on non-socket
   */
  ENOTSOCK = 88,

  /**
   * Destination address required
   */
  EDESTADDRREQ = 89,

  /**
   * Message too long
   */
  EMSGSIZE = 90,

  /**
   * Protocol wrong type for socket
   */
  EPROTOTYPE = 91,

  /**
   * Protocol not available
   */
  ENOPROTOOPT = 92,

  /**
   * Unknown protocol
   */
  EPROTONOSUPPORT = 93,

  /**
   * Socket type not supported
   */
  ESOCKTNOSUPPORT = 94,

  /**
   * Operation not supported on transport endpoint
   */
  EOPNOTSUPP = 95,

  /**
   * Protocol family not supported
   */
  EPFNOSUPPORT = 96,

  /**
   * Address family not supported by protocol family
   */
  EAFNOSUPPORT = 97,

  /**
   * Address already in use
   */
  EADDRINUSE = 98,

  /**
   * Address not available
   */
  EADDRNOTAVAIL = 99,

  /**
   * Network interface is not configured
   */
  ENETDOWN = 100,

  /**
   * Network is unreachable
   */
  ENETUNREACH = 101,

  /**
   * Network dropped connection on reset.
   */
  ENETRESET = 102,

  /**
   * Connection aborted
   */
  ECONNABORTED = 103,

  /**
   * Connection reset by peer
   */
  ECONNRESET = 104,

  /**
   * No buffer space available
   */
  ENOBUFS = 105,

  /**
   * Socket is already connected
   */
  EISCONN = 106,

  /**
   * Socket is not connected
   */
  ENOTCONN = 107,

  /**
   * Can't send after socket shutdown
   */
  ESHUTDOWN = 108,

  /**
   * Too many references: can’t splice.
   */
  ETOOMANYREFS = 109,

  /**
   * Connection timed out
   */
  ETIMEDOUT = 110,

  /**
   * Connection refused
   */
  ECONNREFUSED = 111,

  /**
   * Host is down
   */
  EHOSTDOWN = 112,

  /**
   * Host is unreachable
   */
  EHOSTUNREACH = 113,

  /**
   * Socket already connected
   */
  EALREADY = 114,

  /**
   * Connection already in progress
   */
  EINPROGRESS = 115,

  /**
   * Stale NFS file handle.
   */
  ESTALE = 116,

  /**
   * Not supported
   */
  ENOTSUP = EOPNOTSUPP,

  /**
   * No medium (in tape drive)
   */
  ENOMEDIUM = 123,

  /**
   * Operation canceled.
   */
  ECANCELED = 125,

  /**
   * Inode is remote (not really error)
   */
  ELBIN = 2048,

  /**
   * Inappropriate file type or format
   */
  EFTYPE = 2049,

  /**
   * No more files
   */
  ENMFILE = 2050,

  /**
   * Quotas & mush. Too many processes.
   */
  EPROCLIM = 2051,

  /**
   * No such host or network path
   */
  ENOSHARE = 2052,

  /**
   * Filename exists with different case
   */
  ECASECLASH = 2053,

  /**
   * Operation would block
   */
  EWOULDBLOCK = EAGAIN,
}

export const errorMessages = new Map<Errno, string>([
  [Errno.EPERM, 'Operation not permitted'],
  [Errno.ENOENT, 'No such file or directory'],
  [Errno.ESRCH, 'No such process'],
  [Errno.EINTR, 'Interrupted system call'],
  [Errno.EIO, 'I/O error'],
  [Errno.ENXIO, 'No such device or address'],
  [Errno.E2BIG, 'Argument list too long'],
  [Errno.ENOEXEC, 'Exec format error'],
  [Errno.EBADF, 'Bad file number'],
  [Errno.ECHILD, 'No child processes'],
  [Errno.EAGAIN, 'Try again'],
  [Errno.ENOMEM, 'Out of memory'],
  [Errno.EACCES, 'Permission denied'],
  [Errno.EFAULT, 'Bad address'],
  [Errno.EBUSY, 'Device or resource busy'],
  [Errno.EEXIST, 'File exists'],
  [Errno.EXDEV, 'Cross-device link'],
  [Errno.ENODEV, 'No such device'],
  [Errno.ENOTDIR, 'Not a directory'],
  [Errno.EISDIR, 'Is a directory'],
  [Errno.EINVAL, 'Invalid argument'],
  [Errno.ENFILE, 'File table overflow'],
  [Errno.EMFILE, 'Too many open files'],
  [Errno.ENOTTY, 'Not a typewriter'],
  [Errno.EFBIG, 'File too large'],
  [Errno.ENOSPC, 'No space left on device'],
  [Errno.ESPIPE, 'Illegal seek'],
  [Errno.EROFS, 'Read-only file system'],
  [Errno.EMLINK, 'Too many links'],
  [Errno.EPIPE, 'Broken pipe'],
  [Errno.ENAMETOOLONG, 'File name too long'],
  [Errno.ENOSYS, 'not implemented on js'],
  [Errno.EDQUOT, 'Quota exceeded'],
  [Errno.EDOM, 'Math arg out of domain of func'],
  [Errno.ERANGE, 'Math result not representable'],
  [Errno.EDEADLK, 'Deadlock condition'],
  [Errno.ENOLCK, 'No record locks available'],
  [Errno.ENOTEMPTY, 'Directory not empty'],
  [Errno.ELOOP, 'Too many symbolic links'],
  [Errno.ENOMSG, 'No message of desired type'],
  [Errno.EIDRM, 'Identifier removed'],
  [Errno.ECHRNG, 'Channel number out of range'],
  [Errno.EL2NSYNC, 'Level 2 not synchronized'],
  [Errno.EL3HLT, 'Level 3 halted'],
  [Errno.EL3RST, 'Level 3 reset'],
  [Errno.ELNRNG, 'Link number out of range'],
  [Errno.EUNATCH, 'Protocol driver not attached'],
  [Errno.ENOCSI, 'No CSI structure available'],
  [Errno.EL2HLT, 'Level 2 halted'],
  [Errno.EBADE, 'Invalid exchange'],
  [Errno.EBADR, 'Invalid request descriptor'],
  [Errno.EXFULL, 'Exchange full'],
  [Errno.ENOANO, 'No anode'],
  [Errno.EBADRQC, 'Invalid request code'],
  [Errno.EBADSLT, 'Invalid slot'],
  [Errno.EBFONT, 'Bad font file fmt'],
  [Errno.ENOSTR, 'Device not a stream'],
  [Errno.ENODATA, 'No data (for no delay io)'],
  [Errno.ETIME, 'Timer expired'],
  [Errno.ENOSR, 'Out of streams resources'],
  [Errno.ENONET, 'Machine is not on the network'],
  [Errno.ENOPKG, 'Package not installed'],
  [Errno.EREMOTE, 'The object is remote'],
  [Errno.ENOLINK, 'The link has been severed'],
  [Errno.EADV, 'Advertise error'],
  [Errno.ESRMNT, 'Srmount error'],
  [Errno.ECOMM, 'Communication error on send'],
  [Errno.EPROTO, 'Protocol error'],
  [Errno.EMULTIHOP, 'Multihop attempted'],
  [Errno.EDOTDOT, 'Cross mount point (not really error)'],
  [Errno.EBADMSG, 'Trying to read unreadable message'],
  [Errno.EOVERFLOW, 'Value too large for defined data type'],
  [Errno.ENOTUNIQ, 'Given log. name not unique'],
  [Errno.EBADFD, 'f.d. invalid for this operation'],
  [Errno.EREMCHG, 'Remote address changed'],
  [Errno.ELIBACC, "Can't access a needed shared lib"],
  [Errno.ELIBBAD, 'Accessing a corrupted shared lib'],
  [Errno.ELIBSCN, '.lib section in a.out corrupted'],
  [Errno.ELIBMAX, 'Attempting to link in too many libs'],
  [Errno.ELIBEXEC, 'Attempting to exec a shared library'],
  [Errno.ENOTSOCK, 'Socket operation on non-socket'],
  [Errno.EDESTADDRREQ, 'Destination address required'],
  [Errno.EMSGSIZE, 'Message too long'],
  [Errno.EPROTOTYPE, 'Protocol wrong type for socket'],
  [Errno.ENOPROTOOPT, 'Protocol not available'],
  [Errno.EPROTONOSUPPORT, 'Unknown protocol'],
  [Errno.ESOCKTNOSUPPORT, 'Socket type not supported'],
  [Errno.EOPNOTSUPP, 'Operation not supported on transport endpoint'],
  [Errno.EPFNOSUPPORT, 'Protocol family not supported'],
  [Errno.EAFNOSUPPORT, 'Address family not supported by protocol family'],
  [Errno.EADDRINUSE, 'Address already in use'],
  [Errno.EADDRNOTAVAIL, 'Address not available'],
  [Errno.ENETDOWN, 'Network interface is not configured'],
  [Errno.ENETUNREACH, 'Network is unreachable'],
  [Errno.ECONNABORTED, 'Connection aborted'],
  [Errno.ECONNRESET, 'Connection reset by peer'],
  [Errno.ENOBUFS, 'No buffer space available'],
  [Errno.EISCONN, 'Socket is already connected'],
  [Errno.ENOTCONN, 'Socket is not connected'],
  [Errno.ESHUTDOWN, "Can't send after socket shutdown"],
  [Errno.ETIMEDOUT, 'Connection timed out'],
  [Errno.ECONNREFUSED, 'Connection refused'],
  [Errno.EHOSTDOWN, 'Host is down'],
  [Errno.EHOSTUNREACH, 'Host is unreachable'],
  [Errno.EALREADY, 'Socket already connected'],
  [Errno.EINPROGRESS, 'Connection already in progress'],
  [Errno.ENOMEDIUM, 'No medium (in tape drive)'],
  [Errno.ECANCELED, 'Operation canceled.'],
  [Errno.ELBIN, 'Inode is remote (not really error)'],
  [Errno.EFTYPE, 'Inappropriate file type or format'],
  [Errno.ENMFILE, 'No more files'],
  [Errno.ENOSHARE, 'No such host or network path'],
  [Errno.ECASECLASH, 'Filename exists with different case'],
])
