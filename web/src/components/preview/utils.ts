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
