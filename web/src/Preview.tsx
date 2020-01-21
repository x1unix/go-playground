import React from 'react';
import './Preview.css';
import { EDITOR_FONTS } from './editor/props';
import { Connect } from './store';
import {EvalEvent} from './services/api';
import EvalEventView from './EvalEventView';
import { getTheme } from '@uifabric/styling';
import { MessageBar, MessageBarType } from 'office-ui-fabric-react';


interface PreviewProps {
    lastError?:string | null;
    events?: EvalEvent[]
}

@Connect(s => ({darkMode: s.settings.darkMode, ...s.status}))
export default class Preview extends React.Component<PreviewProps> {
    get styles() {
        const { palette } = getTheme();
        return {
            backgroundColor: palette.neutralLight,
            color: palette.neutralDark,
            fontFamily: EDITOR_FONTS
        }
    }
    render() {
        let content;
        if (this.props.lastError) {
            content = <MessageBar messageBarType={MessageBarType.error} isMultiline={false}>
                <b>Build failed:</b> {this.props.lastError}
            </MessageBar>
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

        return <div className="app-preview" style={this.styles}>
            {content}
        </div>;
    }
}