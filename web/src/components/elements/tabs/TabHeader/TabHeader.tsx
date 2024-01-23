import React, {useState} from 'react'
import { Stack, type IStackStyles } from '@fluentui/react';
import { TabLabel } from '../TabLabel';

const headerStyles: IStackStyles = {
  root: {
    flex: '1 0',
    flexShrink: 0,
  }
};

const cmdStyles: IStackStyles = {
  root: {
    display: 'flex',
    alignItems: 'stretch',
    flexDirection: 'column',
  }
};

interface Props {}

export const TabHeader: React.FC<Props> = () => {
  const [tabCount, setTabCount] = useState(4);
  const [ activeTab, setActiveTab ] = useState(0);
  return (
    <Stack
      grow
      horizontal
      verticalFill
      horizontalAlign='stretch'
      verticalAlign='stretch'
      styles={headerStyles}
    >
      {
        Array.from({length: tabCount}, (_, i) => i).map(i => (
          <TabLabel
            label={`Tab ${i}`}
            active={i === activeTab}
            onClick={() => setActiveTab(i)}
          />
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
