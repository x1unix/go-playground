import React, {useState, useMemo} from 'react'
import {
  Stack,
  useTheme,
  type IStackStyles,
} from '@fluentui/react';

import { TabLabel } from '../TabLabel';

const cmdStyles: IStackStyles = {
  root: {
    display: 'flex',
    alignItems: 'stretch',
    flexDirection: 'column',
  }
};

const tabContainerStyles: IStackStyles = {
  root: {
    flex: 1,
  }
};

interface Props {}

const mockTabName = i => `github.com/pkg/username/internal/main${i}.go`

export const TabHeader: React.FC<Props> = () => {
  const theme = useTheme();
  const [tabCount, setTabCount] = useState(10);
  const [ activeTab, setActiveTab ] = useState(0);

  const headerStyles = useMemo(() => {
    return {
      root: {
        flex: '1 0',
        flexShrink: 0,
        background: theme.semanticColors.bodyStandoutBackground,
      }
    };
  }, [theme]);

  return (
    <Stack
      grow
      wrap
      horizontal
      verticalFill
      horizontalAlign='stretch'
      verticalAlign='stretch'
      styles={headerStyles}
    >
      {
        Array.from({length: tabCount}, (_, i) => i).map(i => (
          <Stack.Item styles={tabContainerStyles}>
            <TabLabel
              label={mockTabName(i)}
              active={i === activeTab}
              onClick={() => setActiveTab(i)}
            />
          </Stack.Item>
        ))
      }
      <Stack.Item styles={cmdStyles}>
        <div style={{background: '#04f', flex: 1}} onClick={() => setTabCount(tabCount + 1)}>+</div>
      </Stack.Item>
      <Stack.Item styles={cmdStyles}>
        <div style={{background: '#0cf', flex: 1}}>DL</div>
      </Stack.Item>
    </Stack>
  )
}
