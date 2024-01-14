import { EvalEvent } from '~/services/api';

export enum Colors {
  Red = '\x1b[31m',
  Reset = '\x1b[0m'
}

export const formatEvalEvent = ({Message: msg, Kind: type}: EvalEvent) => {
  if (type === 'stdout') {
    return msg
  }

  return `${Colors.Red}${msg}${Colors.Reset}`;
}

export const createDebouncableResizeObserver = (callback: () => void, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return new ResizeObserver(() => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(callback, delay);
  });
};
