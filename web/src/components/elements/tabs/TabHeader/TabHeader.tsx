import React, {useState, useMemo} from 'react'
import {
  useTheme,
  Stack,
  FocusZone,
  type IStackStyles,
} from '@fluentui/react';

import { TabLabel } from '../TabLabel';
import { TabActionBar } from '../TabActionBar';
import { TabBarAction } from '../types';

interface Props {
  disabled?: boolean
}

const tabContainerStyles: IStackStyles = {
  root: {
    flex: 1,
  }
};

const mockTabName = i => `github.com/pkg/username/internal/main${i}.go`

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

export const TabHeader: React.FC<Props> = ({disabled}) => {
  const { semanticColors } = useTheme();
  const [tabCount, setTabCount] = useState(5);
  const [ activeTab, setActiveTab ] = useState(0);

  const headerStyles = useMemo(() => {
    return {
      root: {
        flex: '1 0',
        flexShrink: 0,
        background: semanticColors.bodyStandoutBackground,
      }
    };
  }, [semanticColors]);

  const cmdToolbarStyles: IStackStyles = {
    root: {
      // flex: 1,
      display: 'flex',
    }
  };

  return (
    <FocusZone
      style={{flex: 1}}
    >
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
                canClose={tabCount > 1}
                onClick={() => setActiveTab(i)}
              />
            </Stack.Item>
          ))
        }
        <Stack.Item styles={cmdToolbarStyles}>
          <TabActionBar actions={actions} disabled={disabled}/>
        </Stack.Item>
      </Stack>
    </FocusZone>
  )
}
