import React from 'react';
import { useParams } from 'react-router-dom';
import { connect } from 'react-redux';

import { newSnippetLoadDispatcher } from "~/store";
import { Header } from '~/components/core/Header';
import CodeEditor from '~/components/editor/CodeEditor';
import FlexContainer from '~/components/editor/FlexContainer';
import ResizablePreview from '~/components/preview/ResizablePreview';
import StatusBar from '~/components/core/StatusBar';

import './Playground.css';

const Playground = connect()((props: any) => {
  const { snippetID } = useParams();
  props.dispatch(newSnippetLoadDispatcher(snippetID));

  return <div className="playground">
    <Header />
    <FlexContainer>
      <CodeEditor />
    </FlexContainer>
    <ResizablePreview />
    <StatusBar />
  </div>;
});

export default Playground;
