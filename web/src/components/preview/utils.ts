import type { EvalEvent } from '~/services/api';

const imgRegEx = /\bIMAGE:([A-Za-z0-9=+/]+)\b/;

export enum Colors {
  Red = '\x1b[31m',
  Reset = '\x1b[0m'
}

const ESC = '\u001B[';
const OSC = '\u001B]';
const BEL = '\u0007';

/**
 * Formats output event from program.
 */
export const formatEvalEvent = ({Message: msg, Kind: type}: EvalEvent) => {
  if (type === 'stderr') {
    return `${Colors.Red}${msg}${Colors.Reset}`;
  }

  // Convert Go-playground inline images to iTerm2 inline images protocol.
  // See:
  // - https://iterm2.com/documentation-images.html
  // - https://github.com/sindresorhus/ansi-escapes/blob/main/index.js
  return msg.replace(
    imgRegEx,
    `\u001b]1337;File=;inline=1:$1${BEL}`
  );
}

export const createDebounceResizeObserver = (callback: () => void, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return new ResizeObserver(() => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(callback, delay);
  });
};
