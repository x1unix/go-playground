/**
 * Logger implements service logger interface
 */
export interface Logger {
  info: (msg: string) => any
  debug: (msg: string) => any
}

export const ConsoleLogger: Logger = {
  info: console.log,
  debug: console.log,
}
