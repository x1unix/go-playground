import React, { useMemo, useState } from 'react';
import { Stack, useTheme } from '@fluentui/react';
import { containerStyles, tabHeaderStyles, getTabContentStyles } from './styles';

import { TabHeader } from '../TabHeader';
import { TabBarAction, TabInfo } from '../types';

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

export const TabView: React.FC<Props> = ({children}) => {
  const theme = useTheme();
  const tabContentStyles = useMemo(() => getTabContentStyles(theme), [theme]);

  return (
    <Stack
      grow
      verticalFill
      horizontalAlign='stretch'
      verticalAlign='stretch'
      styles={containerStyles}
    >
      <Stack.Item styles={tabHeaderStyles}>
        <TabHeader
          tabs={tabs}
          actions={actions}
          selectedTab={tabs[0]?.key}
          onSelected={key => console.log('selected', key)}
          onClosed={key => console.log('closed', key)}
        />
      </Stack.Item>
      <Stack.Item
        grow
        disableShrink
        styles={tabContentStyles}
      >
        { children }
      </Stack.Item>
    </Stack>
  )
}
