import React, {useMemo} from 'react';
import { nsToMs } from "~/utils/duration";

import './EvalEventView.css';

const imageSectionPrefix = 'IMAGE:';
const base64RegEx = /^[A-Za-z0-9+/]+[=]{0,2}$/;

interface Props {
  message: string,
  kind: string,
  delay: number
  showDelay: boolean
}

const pad = (num: number, size: number) => ('000000000' + num).substr(-size);

const isImageLine = (message: string) => {
  if (!message?.startsWith(imageSectionPrefix)) {
    return [false, null];
  }

  const payload = message.substring(imageSectionPrefix.length).trim();
  return [base64RegEx.test(payload), payload];
};

const formatDelay = (delay: number) => {
  const msec = nsToMs(delay);
  return `T+${pad(msec, 4)}ms`
}

const EvalEventView: React.FC<Props> = ({delay, kind, message, showDelay}) => {
  const [isImage, payload] = useMemo(() => (
    isImageLine(message)
  ), [message]);

  return (
    <div className="evalEvent">
      {
        isImage ? (
          <img src={`data:image;base64,${payload}`} alt=""/>
        ) : (
          <pre
            className={`evalEvent__msg evalEvent__msg--${kind}`}
          >
            {message}
          </pre>
        )
      }
      <span className="evalEvent__delay">
        {showDelay ? `[${formatDelay(delay)}]` : ''}
      </span>
    </div>
  );
}

export default EvalEventView;
