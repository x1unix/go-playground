# WebAssembly Imports List

Here is a list of WASM module imports that the package expects from WASM host.

Each function has a prefix of package name in format: `path/to/package.functionName`

## Core

List of core functions required for all gowasm-based functionality.

**Import name prefix:** `github.com/x1unix/go-playground/internal/gowasm`

**Imports:**

* `func registerCallbackHandler(fn js.Func)`
* `func wasmConsoleWrite(fd int, data []byte)`

See:

* [callback_js.s](callback_js.s)

## Wlog

Wlog is logging interface for WASM workers. Used by other wasm-related packages.

**Import name prefix:** `github.com/x1unix/go-playground/internal/gowasm/wlog`

* `func logWrite(level uint8, data []byte)`

See:

* * [logger_js.s](wlog/writer_js.s)

## BrowserFS

BrowserFS package implements `fs.FS` interface for IndexedDB-based file system.

**Import name prefix:** `github.com/x1unix/go-playground/internal/gowasm/browserfs`

**Imports:**

 * `func stat(name string, out *inode, cb int)`
 * `func readDir(name string, out []inode, cb int)`
 * `func readFile(f inode, out []byte, cb int)`
 * `func writeFile(name string, data []byte, cb int)`
 * `func makeDir(name string, cb int)`
 * `func unlink(name string, cb int)`

See:

* [browserfs/syscall_js.s](browserfs/syscall_js.s)

## PackageDB

Interface to access Go modules cache stored in IndexedDB.

**Import name prefix:** `github.com/x1unix/go-playground/internal/gowasm/packagedb`

**Imports:**

* `func lookupPackage(pkgName string, out []byte, cb int)`
* `func registerPackage(pkgName, version string, cb int)`
* `func removePackage(okgName string, cb int)`

See:

* [packagedb/syscall_js.s](packagedb/syscall_js.s)
