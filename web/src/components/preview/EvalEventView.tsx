import React, {useMemo} from 'react';

import './EvalEventView.css';

const imageSectionPrefix = 'IMAGE:';
const base64RegEx = /^[A-Za-z0-9+/]+[=]{0,2}$/;

interface Props {
  message: string,
  kind: string
}

const isImageLine = (message: string) => {
  if (!message?.startsWith(imageSectionPrefix)) {
    return [false, null];
  }

  const payload = message.substring(imageSectionPrefix.length).trim();
  return [base64RegEx.test(payload), payload];
};

const EvalEventView: React.FC<Props> = ({kind, message}) => {
  const [isImage, payload] = useMemo(() => (
    isImageLine(message)
  ), [message]);

  return (
    <div className="EvalEvent">
      {
        isImage ? (
          <img src={`data:image;base64,${payload}`} alt=""/>
        ) : (
          <pre
            className={`EvalEvent__msg EvalEvent__msg--${kind}`}
          >
            {message}
          </pre>
        )
      }
    </div>
  );
}

export default EvalEventView;
