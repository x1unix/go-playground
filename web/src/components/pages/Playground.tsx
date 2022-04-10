import React from 'react';
import { useParams } from 'react-router-dom';
import { connect } from 'react-redux';

import { newSnippetLoadDispatcher } from "~/store";
import { Header } from '~/components/core/Header';
import CodeEditor from '~/components/editor/CodeEditor';
import FlexContainer from '~/components/editor/FlexContainer';
import ResizablePreview from '~/components/preview/ResizablePreview';
import Layout from '~/components/core/Layout/Layout';
import StatusBar from '~/components/core/StatusBar';
import { LayoutType} from '~/styles/layout';

import './Playground.css';

const Playground = connect()((props: any) => {
  const { snippetID } = useParams();
  props.dispatch(newSnippetLoadDispatcher(snippetID));

  return (
    <div className="Playground">
      <Header />
      <Layout layout={LayoutType.Vertical}>
        <FlexContainer>
          <CodeEditor />
        </FlexContainer>
        <ResizablePreview layout={LayoutType.Vertical} collapsed={false} />
      </Layout>
      <StatusBar />
    </div>
  );
});

export default Playground;
