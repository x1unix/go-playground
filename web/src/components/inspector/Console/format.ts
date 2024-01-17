import type { EvalEvent } from '@services/api';

const imgRegEx = /\bIMAGE:([A-Za-z0-9=+/]+)\b/;

export enum Colors {
  Red = '\x1b[31m',
  Reset = '\x1b[0m'
}

const ESC = '\u001B[';
const OSC = '\u001B]';
const BEL = '\u0007';

/**
 * Calculates number of payload bytes in base64 encoded string.
 * @param b64 Base64-encoded string.
 */
const base64ByteCount = (b64: string) => {
  let padding = 0;
  if (b64.endsWith('==')) {
    padding = 2
  } else if (b64.endsWith('=')) {
    padding = 1
  }
  return (b64.length / 4) * 3 - padding;
}

/**
 * Creates a new inline (iterm) image protocol string from base64-encoded image.
 * @param b64 Base64-encoded image.
 *
 * @see https://iterm2.com/documentation-images.html
 * @see https://github.com/sindresorhus/ansi-escapes/blob/main/index.js
 */
const newInlineImage = (b64: string) => {
  const length = base64ByteCount(b64);
  return `\u001b]1337;File=size=${length};inline=1:${b64}${BEL}`;
}

/**
 * Formats output event from program.
 */
export const formatEvalEvent = ({Message: msg, Kind: type}: EvalEvent) => {
  if (type === 'stderr') {
    return `${Colors.Red}${msg}${Colors.Reset}`;
  }

  // Convert Go-playground inline images to iTerm2 inline images protocol.
  return msg.replace(imgRegEx, (_, b64) => newInlineImage(b64));
}
