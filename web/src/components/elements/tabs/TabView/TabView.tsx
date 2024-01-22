import React from 'react';
import { Stack } from '@fluentui/react';
import { containerStyles, tabHeaderStyles, tabContentStyles } from './styles';

import { TabHeader } from '../TabHeader';

interface Props {}

export const TabView: React.FC<Props> = () => {
  return (
    <Stack
      grow
      verticalFill
      horizontalAlign='stretch'
      verticalAlign='stretch'
      styles={containerStyles}
    >
      <Stack.Item styles={tabHeaderStyles}>
        <TabHeader />
        {/*<div style={{background: 'red', flex: 1}}>Header</div>*/}
      </Stack.Item>
      <Stack.Item
        grow
        disableShrink
        styles={tabContentStyles}
      >
        <div style={{background: 'green', flex: 1}}>Content</div>
      </Stack.Item>
    </Stack>
  )
}
