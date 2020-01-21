import React from 'react';
import { Header } from './Header';
import CodeEditor from './editor/CodeEditor';
import './Playground.css';
import Preview from './Preview';
import { useParams } from "react-router-dom";
import {newSnippetLoadDispatcher} from "./store";
import { connect } from 'react-redux';

const Playground = connect()(function (props) {
    const {snippetID} = useParams();
    props.dispatch(newSnippetLoadDispatcher(snippetID));

    return <div className="playground">
        <Header />
        <CodeEditor />
        <Preview />
    </div>;
});

export default Playground;