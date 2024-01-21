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
import InspectorPanel from '~/components/inspector/InspectorPanel/InspectorPanel';
import { NotificationHost } from "~/components/modals/Notification";
import Layout from '~/components/core/Layout/Layout';
import StatusBar from '~/components/core/StatusBar';

import './PlaygroundPage.css';

interface PageParams {
  snippetID: string
}

const CodeContainer = connect()(({ dispatch }: any) => {
  const { snippetID } = useParams<PageParams>();
  useEffect(() => {
    dispatch(newSnippetLoadDispatcher(snippetID));
  }, [snippetID, dispatch]);

  return (
    <CodeEditor />
  );
})

const PlaygroundPage = connect(({ panel }: any) => ({ panelProps: panel }))(({ panelProps, dispatch }: any) => {
  return (
    <div className="Playground">
      <Header />
      <Layout layout={panelProps.layout}>
        <FlexContainer>
          <CodeContainer />
        </FlexContainer>
        <InspectorPanel
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

export default PlaygroundPage;
