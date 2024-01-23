import React, { useMemo } from 'react';
import { Stack, useTheme } from '@fluentui/react';
import { containerStyles, tabHeaderStyles, getTabContentStyles } from './styles';

import { TabHeader } from '../TabHeader';

interface Props {}

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
        <TabHeader />
      </Stack.Item>
      <Stack.Item
        grow
        disableShrink
        styles={tabContentStyles}
      >
        {/*<div style={{background: 'green', flex: 1}}>Content</div>*/}
        { children }
      </Stack.Item>
    </Stack>
  )
}
