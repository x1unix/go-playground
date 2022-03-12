import React from 'react';
import './EvalEventView.css';

const imageSectionPrefix = 'IMAGE:';
const base64RegEx = /^[A-Za-z0-9+/]+[=]{0,2}$/;
const nanosec = 1000000;

interface ViewData {
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

export default class EvalEventView extends React.Component<ViewData> {
  get delay() {
    const msec = this.props.delay / nanosec;
    return `T+${pad(msec, 4)}ms`
  }

  get domClassName() {
    return `evalEvent__msg evalEvent__msg--${this.props.kind}`;
  }

  render() {
    const { message, showDelay } = this.props;
    const [isImage, payload] = isImageLine(message);
    return <div className="evalEvent">
      { isImage ? (
        <img src={`data:image;base64,${payload}`} alt=""/>
      ) : (
        <pre className={this.domClassName}>{message}</pre>
      )}
      <span className="evalEvent__delay">{showDelay ? `[${this.delay}]` : ''}</span>
    </div>
  }
}
