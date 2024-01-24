import React, { useState, useEffect, useMemo } from 'react';

import { TabView } from '~/components/elements/tabs/TabView';
import type {TabBarAction, TabInfo} from '~/components/elements/tabs/types';

import { CodeEditor } from '../CodeEditor';
import { FlexContainer } from '../FlexContainer';
import { skipIndex } from './utils';


interface Props {}

const mockTabName = i => `main${i}.go`

export const Workspace: React.FC<Props> = () => {
  const [selectedTab, setSelectedTab] = useState<string>();
  const [tabs, setTabs] = useState<TabInfo[]>([]);

  const onClose = (key: string, i: number) => {
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
        const newTab = mockTabName(Date.now());
        setTabs((prev) => ([
          ...prev,
          {
            key: newTab,
            label: newTab,
          }
        ]));
        setSelectedTab(newTab);
      }
    },
    {
      label: 'Upload',
      icon: { iconName: 'Upload' },
      onClick: () => console.log('upload'),
    }
  ], [setTabs, setSelectedTab]);

  return (
    <TabView
      allowEmpty={false}
      actions={actions}
      tabs={tabs}
      selectedTab={selectedTab}
      onClosed={onClose}
      onSelected={setSelectedTab}
    >
      <FlexContainer>
        <CodeEditor />
      </FlexContainer>
    </TabView>
  )
};
