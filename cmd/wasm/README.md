# WebAssembly Workers

This directory contains WebAssembly worker binaries used by the playground.

Workers can be compiled using `make wasm` command.

## analyzer

The analyzer is a WebAssembly worker that analyzes a given Go source file and returns errors for Monaco Editor.

## go-repl

The go-repl is a WebAssembly worker that interprets Go code using Yaegi Go interpreter.
