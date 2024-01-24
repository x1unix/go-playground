import React, { useState, useCallback, useEffect, useMemo } from 'react';

import { TabView } from '~/components/elements/tabs/TabView';
import type {TabBarAction, TabInfo} from '~/components/elements/tabs/types';

import { CodeEditor } from '../CodeEditor';
import { FlexContainer } from '../FlexContainer';
import { NewFileModal } from '../NewFileModal';
import { skipIndex } from './utils';


interface Props {}

const mockTabName = i => `main${i}.go`

export const Workspace: React.FC<Props> = () => {
  const [ modalOpen, setModalOpen ] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>();
  const [tabs, setTabs] = useState<TabInfo[]>([]);

  const onTabClose = (key: string, i: number) => {
    if (key === selectedTab) {
      const nextId = i === 0 ? 1 : i - 1;
      const nextKey = tabs[nextId]?.key;
      setSelectedTab(nextKey);
    }
    setTabs((prev) => skipIndex(prev, i));
  };

  const actions: TabBarAction[] = useMemo(() => [
    {
      label: 'New file',
      icon: { iconName: 'Add' },
      onClick: () => {
        setModalOpen(true);
      }
    },
    {
      label: 'Upload',
      icon: { iconName: 'Upload' },
      onClick: () => console.log('upload'),
    }
  ], [setModalOpen]);

  const onModalClose = (fileName?: string) => {
    setModalOpen(false);
    if (!fileName) {
      return;
    }
    setTabs((prev) => ([
      ...prev,
      {
        key: fileName,
        label: fileName,
      }
    ]));
    setSelectedTab(fileName);
  };

  return (
    <TabView
      allowEmpty={false}
      actions={actions}
      tabs={tabs}
      selectedTab={selectedTab}
      onClosed={onTabClose}
      onSelected={setSelectedTab}
    >
      <FlexContainer>
        <CodeEditor />
      </FlexContainer>
      <NewFileModal
        isOpen={modalOpen}
        onClose={onModalClose}
      />
    </TabView>
  )
};
