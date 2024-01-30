export enum ConsoleStreamType {
  Stdin = 0,
  Stdout = 1,
  Stderr = 2,
}

export interface ConsoleHandler {
  write: (fd: ConsoleStreamType, msg: string) => any
}
