import React, { useState, useEffect, useMemo } from 'react';

import { TabView } from '~/components/elements/tabs/TabView';
import type {TabBarAction, TabInfo} from '~/components/elements/tabs/types';

import { CodeEditor } from '../CodeEditor';
import { FlexContainer } from '../FlexContainer';


interface Props {}

const actions: TabBarAction[] = [
  {
    label: 'New file',
    icon: { iconName: 'Add' },
    onClick: () => console.log('new-file'),
  },
  {
    label: 'Upload',
    icon: { iconName: 'Upload' },
    onClick: () => console.log('upload'),
  }
];

const mockTabsCount = 2;
const mockTabName = i => `github.com/pkg/username/internal/main${i}.go`
const tabs: TabInfo[] = Array.from({length: mockTabsCount}, (_, i) => ({
  key: mockTabName(i),
  label: mockTabName(i),
}))

export const Workspace: React.FC<Props> = () => {
  const [selectedTab, setSelectedTab] = useState<string>();
  const [tabs, setTabs] = useState<TabInfo[]>([]);

  const actions = useMemo(() => [
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
  const onClose = (key: string, i: number) => {
    
  };

  return (
    <TabView
      allowEmpty={false}
      actions={actions}
      tabs={tabs}
      selectedTab={selectedTab}
    >
      <FlexContainer>
        <CodeEditor />
      </FlexContainer>
    </TabView>
  )
};
