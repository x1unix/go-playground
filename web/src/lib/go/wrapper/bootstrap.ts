import { GoWrapper } from "./wrapper";

/**
 * Creates a Go class wrapper.
 * @param goClassProto Go class
 */
export const extendGoClass = function(goClassProto: object): typeof GoWrapper {
  // Replace GoWrapper fake prototype with passed Go class prototype
  // and return wrapper instance.
  return Object.setPrototypeOf(GoWrapper, goClassProto);
}
