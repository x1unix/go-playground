import React, { useState } from 'react';
import { useParams } from "react-router-dom";
import { connect } from 'react-redux';
import { newSnippetLoadDispatcher } from "~/store";
import { Header } from '~/components/core/Header';
import CodeEditor from '~/components/editor/CodeEditor';
import Preview from '~/components/preview/Preview';
import './Playground.css';

const Playground = connect()(function (props: any) {
  const { snippetID } = useParams();
  props.dispatch(newSnippetLoadDispatcher(snippetID));

  return <div className="playground">
    <Header />
    <CodeEditor />
    <Preview />
  </div>;
});

export default Playground;