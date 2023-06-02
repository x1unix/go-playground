import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { connect } from 'react-redux';

import {
  dispatchPanelLayoutChange,
  newSnippetLoadDispatcher,
} from '~/store';
import { Header } from '~/components/core/Header';
import CodeEditor from '~/components/editor/CodeEditor';
import FlexContainer from '~/components/editor/FlexContainer';
import ResizablePreview from '~/components/preview/ResizablePreview';
import { NotificationHost } from "~/components/modals/Notification";
import Layout from '~/components/core/Layout/Layout';
import StatusBar from '~/components/core/StatusBar';

import './Playground.css';

const CodeContainer = connect()(({ dispatch }: any) => {
  const { snippetID } = useParams();
  useEffect(() => {
    dispatch(newSnippetLoadDispatcher(snippetID));
  }, [snippetID, dispatch]);

  return (
    <CodeEditor />
  );
})

const Playground = connect(({ panel }: any) => ({ panelProps: panel }))(({ panelProps, dispatch }: any) => {
  return (
    <div className="Playground">
      <Header />
      <Layout layout={panelProps.layout}>
        <FlexContainer>
          <CodeContainer />
        </FlexContainer>
        <ResizablePreview
          {...panelProps}
          onViewChange={changes => {
            dispatch(dispatchPanelLayoutChange(changes))
          }}
        />
        <NotificationHost />
      </Layout>
      <StatusBar />
    </div>
  );
});

export default Playground;
