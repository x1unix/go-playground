import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { connect } from 'react-redux';

import {
  dispatchPanelLayoutChange,
  newSnippetLoadDispatcher,
} from '~/store';
import { Header } from '~/components/layout/Header';
import { CodeEditor } from '~/components/features/editor/CodeEditor';
import { FlexContainer } from '~/components/features/editor/FlexContainer';
import { InspectorPanel } from '~/components/features/inspector/InspectorPanel/InspectorPanel';
import { NotificationHost } from "~/components/modals/Notification";
import { Layout } from '~/components/layout/Layout/Layout';
import { ConnectedStatusBar } from '~/components/layout/StatusBar';

import { TabView } from '~/components/elements/tabs/TabView';

import styles from './PlaygroundPage.module.css';

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

export const PlaygroundPage = connect(({ panel }: any) => ({ panelProps: panel }))(({ panelProps, dispatch }: any) => {
  return (
    <div className={styles.Playground}>
      <Header />
      <Layout layout={panelProps.layout}>
        {/*<FlexContainer>*/}
        {/*  <CodeContainer />*/}
        {/*</FlexContainer>*/}
        <TabView />
        <InspectorPanel
          {...panelProps}
          onViewChange={changes => {
            dispatch(dispatchPanelLayoutChange(changes))
          }}
        />
        <NotificationHost />
      </Layout>
      <ConnectedStatusBar />
    </div>
  );
});
