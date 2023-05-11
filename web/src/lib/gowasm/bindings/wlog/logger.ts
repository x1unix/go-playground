/**
 * Logger implements service logger interface
 */
export interface Logger {
  info(msg: string)
  debug(msg: string)
}

export const ConsoleLogger: Logger = {
  info: console.log,
  debug: console.log
};
