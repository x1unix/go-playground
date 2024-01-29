import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { connect } from 'react-redux';

import {
  dispatchPanelLayoutChange,
  newSnippetLoadDispatcher,
} from '~/store';
import { Header } from '~/components/layout/Header';
import { Workspace } from '~/components/features/workspace/Workspace';
import { InspectorPanel } from '~/components/features/inspector/InspectorPanel/InspectorPanel';
import { NotificationHost } from "~/components/modals/Notification";
import { Layout } from '~/components/layout/Layout/Layout';
import { ConnectedStatusBar } from '~/components/layout/StatusBar';

import styles from './PlaygroundPage.module.css';

interface PageParams {
  snippetID: string
}

export const PlaygroundPage = connect(({ panel }: any) => ({ panelProps: panel }))(({ panelProps, dispatch }: any) => {
  const { snippetID } = useParams<PageParams>();
  useEffect(() => {
    dispatch(newSnippetLoadDispatcher(snippetID));
  }, [snippetID, dispatch]);

  return (
    <div className={styles.Playground}>
      <Header />
      <Layout layout={panelProps.layout}>
        <Workspace />
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