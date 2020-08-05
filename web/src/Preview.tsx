import React from 'react';
import './Preview.css';
import {getDefaultFontFamily} from './services/fonts';
import {Connect} from './store';
import { RuntimeType } from './services/config';
import {EvalEvent} from './services/api';
import EvalEventView from './EvalEventView';
import {getTheme} from '@uifabric/styling';
import {MessageBar, MessageBarType} from 'office-ui-fabric-react';
import {ProgressIndicator} from 'office-ui-fabric-react/lib/ProgressIndicator';

interface PreviewProps {
    lastError?:string | null;
    events?: EvalEvent[]
    loading?: boolean
    runtime?: RuntimeType
}

@Connect(s => ({darkMode: s.settings.darkMode, runtime: s.settings.runtime, ...s.status}))
export default class Preview extends React.Component<PreviewProps> {
    get styles() {
        const { palette } = getTheme();
        return {
            backgroundColor: palette.neutralLight,
            color: palette.neutralDark,
            fontFamily: getDefaultFontFamily(),
        }
    }

    get progressClass() {
        return this.props.loading ? 'app-preview__progress' : 'app-preview__progress--hidden';
    }

    render() {
        // Some content should not be displayed in WASM mode (like delay, etc)
        const isWasm = this.props.runtime === RuntimeType.WebAssembly;
        let content;
        if (this.props.lastError) {
            content = <MessageBar messageBarType={MessageBarType.error} isMultiline={true}>
                <b className='app-preview__label'>Error</b>
                <pre className='app-preview__errors'>
                    {this.props.lastError}
                </pre>
            </MessageBar>
        } else if (this.props.events) {
            content = this.props.events.map((e, k) => <EvalEventView
                key={k}
                message={e.Message}
                delay={e.Delay}
                kind={e.Kind}
                showDelay={!isWasm}
            />);

            if (!isWasm) {
                content.push(<div className="app-preview__epilogue" key="exit">Program exited.</div>)
            }
        } else {
            content = <span>Press "Run" to compile program.</span>;
        }

        return <div className="app-preview" style={this.styles}>
            <ProgressIndicator className={this.progressClass}/>
            <div className='app-preview__content'>
                {content}
            </div>
        </div>;
    }
}