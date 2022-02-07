import React, { useState } from 'react';
import { useParams } from "react-router-dom";
import { connect } from 'react-redux';
import { Resizable } from 're-resizable';
import { newSnippetLoadDispatcher } from "~/store";
import { Header } from '~/components/core/Header';
import CodeEditor from '~/components/editor/CodeEditor';
import Preview from '~/components/preview/Preview';
import FlexContainer from '~/components/editor/FlexContainer';
import './Playground.css';

const Playground = connect()(function (props: any) {
  const { snippetID } = useParams();
  props.dispatch(newSnippetLoadDispatcher(snippetID));

  const [height, setHeight] = useState(300);
  const onResize = (e, direction, ref, d) => {
    setHeight(height + d.height);
    console.log('onResize', d);
  };

  return <div className="playground">
    <Header />
    <FlexContainer>
      <CodeEditor />
    </FlexContainer>
    <Resizable size={{ height, width: '100%' }} onResizeStop={onResize}>
      <Preview />
    </Resizable>
  </div>;
});

export default Playground;