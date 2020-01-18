import React from 'react';
import './EvalEventView.css';

const nanosec = 1000000;

interface ViewData {
    message: string,
    kind: string,
    delay: number
}

const pad = (num: number, size: number) => ('000000000' + num).substr(-size);

export default class EvalEventView extends React.Component<ViewData> {
    get delay() {
        const msec = this.props.delay / nanosec;
        return `T+${pad(msec, 4)}ms`
    }

    get domClassName() {
        return `evalEvent__msg evalEvent__msg--${this.props.kind}`;
    }

    render() {
        return <div className="evalEvent">
            <pre className={this.domClassName}>{this.props.message}</pre>
            <span className="evalEvent__delay">[{this.delay}]</span>
        </div>
    }
}