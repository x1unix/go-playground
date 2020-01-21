import React from 'react';
import { Header } from './Header';
import CodeEditor from './editor/CodeEditor';
import './Playground.css';
import Preview from './Preview';

export default class Playground extends React.Component{
    render() {
        return <div className="playground">
            <Header />
            <CodeEditor />
            <Preview />
        </div>;
    }
}