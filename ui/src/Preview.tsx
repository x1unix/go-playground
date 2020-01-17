import React from 'react';
import './Preview.css';
import { EDITOR_FONTS } from './editor/props';
import { Connect } from './store/state';
import {EvalEvent} from './services/api';
import EvalEventView from './EvalEventView';

const styles = {
    fontFamily: EDITOR_FONTS
};

interface PreviewProps {
    lastError?:string | null;
    events?: EvalEvent[]
}

@Connect(s => ({lastError: s.lastError, events: s.events}))
export default class Preview extends React.Component<PreviewProps> {
    render() {
        let content;
        if (this.props.lastError) {
            content = <span className="app-preview__error">{this.props.lastError}</span>;
        } else if (this.props.events) {
            content = this.props.events.map((e, k) => <EvalEventView
                key={k}
                message={e.Message}
                delay={e.Delay}
                kind={e.Kind}
            />);

            content.push(<div className="app-preview__epilogue" key="exit">Program exited.</div>)
        } else {
            content = <span>Press "Run" to compile program.</span>;
        }

        return <div className="app-preview" style={styles}>
            {content}
        </div>;
    }
}